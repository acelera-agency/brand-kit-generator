# Brand Kit Generator — Site Iteration, History, Token Quota & Collaborators

## Context

El SaaS ya genera un brand kit completo y un sitio con v0 a partir del kit. Hoy `/kit/[id]/site` muestra un iframe + botones "Regenerate" y "Open in new tab" — y se acabó. El usuario reporta:
- **Fricción UX post-generación**: una vez creado el sitio, no hay forma de iterar sobre él sin volver a generar desde cero.
- **Sin trazabilidad**: no se ve qué pidió, cuántas iteraciones lleva, ni qué consumió.
- **Sin colaboración**: el brand kit es estrictamente del owner; no se puede compartir con un equipo o cliente.

Este plan extiende `/kit/[id]/site` con cuatro features acopladas:
1. Chat continuo de iteración con v0 (`chats.sendMessage`).
2. Historial de iteraciones con restore (`chats.getVersion`).
3. Cuota de tokens por user del SaaS, alimentada con el costo real reportado por v0 (`reports.getUsage`).
4. Invitar colaboradores con roles owner/editor/viewer vía email (Resend).

**Scope explícito**: solo `/kit/[id]/site` y endpoints relacionados. NO se tocan dashboard, interview, foundation cards, manual modules ni el design system (Tailwind custom, no shadcn).

## Decisiones tomadas

| Decisión | Elegido |
|---|---|
| Modelo de tokens | **Cuota per-user del SaaS, descontada con el costo real de `v0.reports.getUsage()`** (la API key de v0 es única, así que el balance global no sirve por user) |
| Alcance UX | **Solo post-generación** (`/kit/[id]/site` y su backend) |
| Colaboración | **Roles owner/editor/viewer + invitación por email con magic link** (Resend) |
| Historial | **Restaurable**: click en versión anterior cambia preview + permite "Continue from here" |

## Hallazgos clave del código (validados)

- `web-app/app/api/kits/[id]/site-status/route.ts:36-74` — la generación real corre acá (lazy kick-off): el POST a `generate-site` sólo crea la fila `site_generations`; el primer GET de polling toma un lock con `v0_chat_id='pending'` y ejecuta `executeGeneration()`. **Reusamos exactamente este patrón para iteraciones** (evita timeouts serverless).
- `web-app/app/api/kits/[id]/site-status/route.ts:120-144` — la única llamada actual a v0 es `chats.create({ message: prompt })`; el response se castea a `any` (typing débil). Hay margen para mejorar tipado al agregar wrappers en `lib/v0-client.ts`.
- `web-app/app/kit/[id]/site/SitePreview.tsx:20-174` — componente cliente monolítico. Lo splitteamos en `SiteWorkspace` + 5 sub-componentes.
- `web-app/lib/v0-client.ts:7-15` — wrapper trivial (singleton). Acá agregamos los helpers nuevos: `sendIterationMessage`, `getVersion`, `getUsageForMessage`.
- `web-app/supabase/migrations/0001_initial.sql:60-78` y `0005_site_generations.sql:22-28` — todas las RLS son `owner_id = auth.uid()`. **Hay que migrarlas** para que viewer/editor puedan leer kits ajenos cuando son miembros.
- No hay `package.json` con `resend`, no hay servicio de email. Hay que instalarlo.
- v0-sdk types confirmados en `node_modules/v0-sdk/dist/index.d.ts`:
  - `chats.sendMessage({ chatId, message })`, `chats.getVersion({ chatId, versionId })`, `chats.findMessages({ chatId, limit })` — todos disponibles.
  - `reports.getUsage({ chatId?, messageId?, limit? })` retorna eventos con `promptCost`, `completionCost`, `totalCost`, `chatId`, `messageId`. Esto es lo que usamos para descontar tokens reales.
  - `user.getBilling()` retorna el balance global (NO usar para per-user — se consumiría compartido).

## Plan de cambios

### A. Migraciones SQL nuevas (en `web-app/supabase/migrations/`)

#### `0006_kit_members.sql`
- Tabla `kit_members(kit_id, user_id, role check ('owner','editor','viewer'), created_at)`, PK `(kit_id, user_id)`.
- Función `is_kit_member(k uuid, min_role text default 'viewer') returns boolean language sql stable security definer` — chequea membership con jerarquía de roles. `SECURITY DEFINER` evita recursión RLS.
- RLS: select propias o `is_kit_member(kit_id,'viewer')`; ALL restringido a `is_kit_member(kit_id,'owner')`.
- **Backfill**: `insert into kit_members select id, owner_id, 'owner' from brand_kits on conflict do nothing`.
- **Trigger** `kit_owner_autoadd` after insert on `brand_kits` → inserta row owner automáticamente.

#### `0007_kit_invitations.sql`
- Tabla `kit_invitations(id, kit_id, email, role check ('editor','viewer'), token unique, invited_by, expires_at default now()+'7 days', accepted_at, accepted_by, created_at)`.
- Unique partial index `(kit_id, email) where accepted_at is null` — evita invites duplicados pendientes.
- RLS: ALL restringido a `is_kit_member(kit_id,'owner')`. El accept usa service client (bypass RLS).

#### `0008_site_iterations.sql`
- Tabla `site_iterations(id, generation_id fk site_generations, kit_id, actor_id fk auth.users, turn_index int, user_message text, v0_message_id, v0_version_id, demo_url, status check ('pending','running','completed','failed'), error_message, prompt_cost numeric, completion_cost numeric, total_cost numeric, tokens_charged bigint, usage_synced_at, created_at)`.
- Índices: `(generation_id, turn_index)`, `(kit_id, created_at desc)`, `(actor_id)`.
- RLS: select `is_kit_member(kit_id,'viewer')`; insert `is_kit_member(kit_id,'editor') and actor_id=auth.uid()`. Updates solo via service client.
- **Backfill**: para cada `site_generations` con `status='completed'`, insertar fila `turn_index=0, user_message=null, v0_message_id=null, v0_version_id=…, demo_url=…, status='completed'`.

#### `0009_token_quota.sql`
- Tabla `token_quota(user_id pk, monthly_limit bigint default 100000, current_month_used bigint default 0, current_month_start date default date_trunc('month',now()), updated_at)`.
- RLS select: `user_id = auth.uid()`. Updates solo service client.
- Función `claim_token_budget(p_user_id uuid, p_estimate bigint) returns boolean` — atómica: chequea + incrementa `current_month_used` en una sola query, retorna `false` si excede `monthly_limit`. Evita race conditions cuando dos iteraciones se disparan a la vez.

#### `0010_update_rls_for_members.sql`
- Drop & recreate policies de `brand_kits`, `interview_messages`, `stage_progress`, `site_generations` para usar `is_kit_member(...)`:
  - SELECT: viewer+
  - UPDATE/INSERT (excepto crear brand_kit nuevo): editor+
  - DELETE: owner-only
- INSERT en `brand_kits` queda owner-only (creación de kits nuevos).

### B. Cambios en `web-app/lib/v0-client.ts`

Agregar wrappers tipados sobre el singleton (mantener `getV0Client` existente):

```ts
export async function sendIterationMessage(chatId, message): Promise<{messageId, versionId, demoUrl, files}>
export async function getVersion(chatId, versionId): Promise<{demoUrl, files}>
export async function getUsageForMessage(chatId, messageId): Promise<{promptCost, completionCost, totalCost} | null>
export async function fetchInitialHistory(chatId): Promise<Message[]>  // backfill helper
```

`getUsageForMessage` con retry exponencial (1s/2s/4s/8s/16s) porque el evento puede tardar en aparecer en `reports`.

### C. Helper nuevo: `web-app/lib/token-quota.ts`

- `getOrInitQuota(userId)` — crea row si falta; resetea `current_month_used=0` si `current_month_start < date_trunc('month', now())`.
- `reserveTokens(userId, estimate)` — llama a `claim_token_budget` SQL function; retorna `{ok: false}` si excede.
- `chargeRealCost(userId, iterationId, totalCost)` — convierte `totalCost` a `tokens_charged`, calcula delta vs estimate, ajusta `current_month_used`, persiste en `site_iterations`.
- `refund(userId, amount)` — restituye en caso de fallo.

### D. Helper nuevo: `web-app/lib/email/resend.ts` + template

- Singleton `getResend()` con `RESEND_API_KEY` env.
- `sendInviteEmail({ to, inviterName, kitName, role, token })` → genera `${NEXT_PUBLIC_APP_URL}/invite/${token}` y manda email con template HTML inline (brand colors `#0B0F14`/`#F7F5EF`/accent). Plantilla en `lib/email/templates/invite.ts` (string template, no JSX).
- Env nuevos: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`.
- Si Resend falla, marcar invite con error pero **no** fallar el endpoint — owner puede reenviar.

### E. Endpoints API nuevos / modificados

Todos bajo `web-app/app/api/`. Auth check + role check defensivo en cada uno (no confiar solo en RLS para business rules).

| Método + ruta | Rol mínimo | Función |
|---|---|---|
| `POST /kits/[id]/iterate` | editor | Body `{message}`. Reserva tokens (estimate=2000). Inserta `site_iterations` con `status='pending'`, `turn_index=next`. Retorna `{iterationId}`. **No llama a v0** (lazy pattern). |
| `GET /kits/[id]/iterate-status?iterationId=...` | viewer | Si `pending`: lock → llama `sendIterationMessage` → persiste `v0_message_id/v0_version_id/demo_url` → `status='completed'` → fire-and-forget `syncUsageForIteration()`. Si `completed` y `usage_synced_at=null`: reintentar sync. Retorna estado. |
| `GET /kits/[id]/iterations` | viewer | Lista turns + actor email + tokens. Para historial UI. |
| `POST /kits/[id]/iterations/[iterId]/restore` | editor | `getVersion(chatId, versionId)` → actualiza `site_generations` con la versión restored → inserta nueva fila iteration `user_message='(restored vN)'`, `tokens_charged=0`. |
| `GET /users/me/token-quota` | self | Retorna `{used, limit, remaining, monthStart}`. Llama `getOrInitQuota`. |
| `GET /kits/[id]/members` | viewer | Lista miembros + invites pendientes. |
| `POST /kits/[id]/members` | owner | Body `{email, role}`. Crea `kit_invitations` row, llama `sendInviteEmail`. |
| `PATCH /kits/[id]/members/[userId]` | owner | Cambia rol. Refusa demote del último owner. |
| `DELETE /kits/[id]/members/[userId]` | owner | Quita miembro. |
| `GET /invite/[token]` (page) | público | Render "You've been invited". Si no logueado → `/login?next=/invite/[token]`. Si logueado y `auth.users.email==invitation.email` (case-insensitive) → POST accept → redirect `/kit/[id]`. |
| `POST /invitations/[token]/accept` | logueado | Inserta `kit_members`, marca `accepted_at`/`accepted_by`. Service client. |

**Modificaciones a endpoints existentes**:
- `web-app/app/api/kits/[id]/site-status/route.ts`: en `executeGeneration()`, después de marcar `completed`, **insertar fila `site_iterations` con `turn_index=0`** (representa la generación inicial). Reemplazar `.eq("owner_id", user.id)` por consulta confiando en RLS (viewer puede leer).
- `web-app/app/api/kits/[id]/generate-site/route.ts`: chequear `is_kit_member(...,'editor')` y reservar tokens antes de crear la fila `site_generations`.

### F. Refactor de UI: `web-app/app/kit/[id]/site/`

Splittear el `SitePreview.tsx` monolítico en:

```
site/
├── page.tsx                  ← server: fetch kit + generation + iterations + members + quota
├── SiteWorkspace.tsx         ← client: top-level state + polling
├── PreviewPane.tsx           ← iframe + version label + "Open in new tab" + "Regenerate"
├── ChatPanel.tsx             ← textarea + send. Disabled si viewer / quota=0 / iteration in flight
├── HistoryList.tsx           ← lista de turns. Click → preview de esa versión. "Continue from here"
├── QuotaBadge.tsx            ← "32k / 100k tokens this month" + barra
├── MembersPanel.tsx          ← lista miembros + invites + form de invitar (owner-only)
└── empty/incomplete states reusados de SitePreview actual (lines 89-110)
```

Estilo: mantener tokens del design system actual (`btn-primary`, `border-rule-strong`, `text-muted`, `font-display`, `font-mono`). NO introducir shadcn.

#### Wireframe del nuevo `/kit/[id]/site`

```
+-------------------------------------------------------------------------------+
| Site generation / KIT-AB12  [Back to kit]                                    |
| {kit.name}                            [Owner pill]  [32k/100k]  [Members ▾]  |
+-------------------------------------------------------------------------------+
| PREVIEW                                  | HISTORY                            |
| +------------------------------------+   | ● v3 current · you · 4.2k tok      |
| | v3 · demo_url                       |  |   "make the hero darker"           |
| | [iframe]                            |  | ─────────                          |
| |                                     |  | ○ v2 · ana · 3.1k tok              |
| |                                     |  |   "add pricing section"            |
| |                                     |  |   [Preview] [Continue from here]   |
| |                                     |  | ─────────                          |
| |                                     |  | ○ v1 · you · 0k tok (initial)      |
| +------------------------------------+   |                                    |
| [Open in new tab] [Regenerate]            |                                    |
+-------------------------------------------+------------------------------------+
| CHAT                                                                         |
| > Type a change request…                                                 [→] |
| Last: "make the hero darker" (running… v0 is building, ~30s)                 |
+-------------------------------------------------------------------------------+
| MEMBERS (collapsible)                                                         |
| you   owner       ana@x.com  editor [×]   bob@x.com  viewer  [pending]       |
| [+ Invite: email______ role[viewer▾] [Send]]                                 |
+-------------------------------------------------------------------------------+
```

## Orden de implementación

Phases dentro pueden paralelizarse; entre phases hay dependencias.

**Phase A — Foundation DB (blocking)**
1. `0006_kit_members.sql` (tabla + función `is_kit_member` + backfill + trigger)
2. `0010_update_rls_for_members.sql` (swap RLS de tablas existentes)
3. Smoke test: dashboard, interview, kit view, site view siguen funcionando como owner.

**Phase B — Iteration core**
4. `0008_site_iterations.sql` + backfill de `turn_index=0` para generations existentes
5. Wrappers en `lib/v0-client.ts` (`sendIterationMessage`, `getVersion`, `fetchInitialHistory`, `getUsageForMessage`)
6. Endpoints `POST /iterate`, `GET /iterate-status`, `GET /iterations`
7. Modificar `executeGeneration` para insertar fila iteration `turn_index=0`

**Phase C — Tokens** (paraleliable con Phase D)
8. `0009_token_quota.sql` + función `claim_token_budget`
9. `lib/token-quota.ts` helpers
10. `GET /users/me/token-quota`
11. Wire `syncUsageForIteration` (estimate → real con retries) en `iterate-status`
12. Aplicar quota check a `/iterate` y `/generate-site`

**Phase D — UI refactor**
13. Split `SitePreview.tsx` → `SiteWorkspace` + `PreviewPane` + `ChatPanel` + `HistoryList` + `QuotaBadge`
14. Polling + estado optimista + restore flow

**Phase E — Collaborators**
15. `0007_kit_invitations.sql`
16. `npm i resend` + `lib/email/resend.ts` + template
17. Endpoints `/kits/[id]/members*`
18. `MembersPanel` component
19. Página `/invite/[token]` + endpoint accept
20. Smoke test E2E (ver §Verificación)

## Verificación end-to-end

Probar manualmente con el browser (Chrome MCP) en localhost:3001:

- **Iteración**: como owner, abrir `/kit/X/site` → generar → escribir "make hero dark" en chat → polling → iframe muestra v2.
- **Historial restaurable**: reload → historial muestra v1, v2 → click v1 → preview vuelve → "Continue from here" → enviar "add pricing" → v3 branching.
- **Tokens**: incognito user nuevo → completar kit → generar → `GET /api/users/me/token-quota` decrementa después de cada iteración (esperar ~5s para usage sync). Setear `monthly_limit=1000` por SQL → reintentar iterar → endpoint 402, UI bloquea.
- **Invitaciones**: owner invita `bob@test`, Resend dashboard muestra el envío → abrir `/invite/{token}` en otra sesión → signup → redirect a `/kit/X` → bob abre `/kit/X/site` → puede chatear (editor) → iteraciones registran a bob como actor → la cuota de bob decrementa, no la del owner → owner remueve a bob → bob pierde acceso (RLS 404).

## Riesgos y edge cases

- **Race en cuota**: dos iteraciones simultáneas. **Mitigación**: función SQL `claim_token_budget` atómica con `update ... where current_month_used + est <= monthly_limit returning ...`.
- **Lag en `reports.getUsage`**: el evento puede no estar disponible al instante. **Mitigación**: reservar estimate (2000 tok), poll con backoff 1/2/4/8/16s, reconciliar cuando llega el real (delta puede ser ±). Si pasan 60s sin éxito: dejar `usage_synced_at=null` y exponer endpoint admin `POST /admin/sync-usage` para retry manual.
- **Falla v0 mid-iteración**: marcar `status='failed'`, refund de la reserva, mantener versión anterior como activa.
- **Restore branching**: v0 puede ramificar desde su propio head, no desde la versión "restored". Verificar comportamiento en testing; si SDK soporta `fromVersionId` en sendMessage usarlo, sino documentar como linealización.
- **Recursión RLS**: `kit_members` policies referencian la misma tabla. **Mitigación**: `is_kit_member` con `SECURITY DEFINER`.
- **Demote del último owner**: PATCH refusa si quedaría 0 owners (`select count(*) where role='owner' > 1`).
- **Email mismatch**: accept compara `auth.users.email` vs `kit_invitations.email` case-insensitive. Mismatch → 403.
- **Invitación expirada**: chequear `expires_at` en accept; expirada → UI ofrece reenvío al owner.
- **`site_generations.owner_id`**: queda intacto = kit owner. El nuevo `site_iterations.actor_id` rastrea quién disparó cada iteración (puede ser editor invitado).
- **Polling amplificado** con varios miembros viendo el kit: aceptable a la escala actual; futuro upgrade a Supabase Realtime.
- **Rollover mensual**: hacerlo en `getOrInitQuota` (lazy reset cuando `current_month_start < date_trunc('month', now())`), no en migration ni cron.

## Critical files for implementation

| Archivo | Rol |
|---|---|
| `web-app/app/api/kits/[id]/site-status/route.ts` | **Modificar**: insertar `turn_index=0` row al completar; cambiar filter `owner_id` por RLS |
| `web-app/app/api/kits/[id]/generate-site/route.ts` | **Modificar**: chequear editor+ y reservar tokens |
| `web-app/app/kit/[id]/site/page.tsx` | **Modificar**: fetch iterations + members + quota |
| `web-app/app/kit/[id]/site/SitePreview.tsx` | **Reemplazar** por `SiteWorkspace` + 5 sub-componentes nuevos |
| `web-app/lib/v0-client.ts` | **Extender** con wrappers tipados |
| `web-app/lib/supabase.ts` | Reusado as-is |
| `web-app/lib/token-quota.ts` | **Nuevo** |
| `web-app/lib/email/resend.ts` + `templates/invite.ts` | **Nuevos** |
| `web-app/supabase/migrations/0006…0010_*.sql` | **Nuevos** |
| `web-app/middleware.ts` | Reusado as-is |
| `package.json` | Agregar `resend` |
| `.env.local.example` | Agregar `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL` |
