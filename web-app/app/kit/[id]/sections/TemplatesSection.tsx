import type { BrandKit, VoiceLintSectionResult } from "@/lib/types";
import { InlineEditableText } from "../InlineEditableText";
import { ApplyLintBanner } from "./ApplyLintBanner";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";
import { LintBanner } from "./LintBanner";

type Props = {
  data: BrandKit["templates"] | undefined;
  kitId: string;
  canEdit: boolean;
  lint?: Record<string, VoiceLintSectionResult>;
};

export function TemplatesSection({ data, kitId, canEdit, lint }: Props) {
  if (!data) {
    return <EmptySectionPlaceholder stageNumber={6} stageLabel="Application templates" kitId={kitId} />;
  }

  return (
    <section className="border-t border-rule pt-12 mt-12">
      <p className="eyebrow mb-4 block">06 — Application templates</p>
      <p className="text-sm text-muted-strong mb-8 max-w-[60ch]">
        Real copy the brand will paste into actual surfaces. No lorem.
      </p>

      <div className="space-y-10">
        {data.homepageHero ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Homepage hero</p>
            <div className="rounded-lg border border-rule-strong bg-paper-pure overflow-hidden shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-rule px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-signal/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-rule-strong" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent/40" />
                <span className="ml-3 font-mono text-[10px] text-muted">homepage</span>
              </div>
              <div className="p-6 sm:p-8 space-y-3">
                <InlineEditableText
                  kitId={kitId}
                  path="templates.homepageHero.eyebrow"
                  value={data.homepageHero.eyebrow}
                  canEdit={canEdit}
                  className="font-mono text-xs uppercase tracking-widest text-muted"
                  textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 font-mono text-xs uppercase tracking-widest text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
                  minRows={1}
                />
                <InlineEditableText
                  kitId={kitId}
                  path="templates.homepageHero.h1"
                  value={data.homepageHero.h1}
                  canEdit={canEdit}
                  className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl"
                  textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 font-display text-2xl font-semibold leading-tight text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
                  minRows={2}
                />
                <InlineEditableText
                  kitId={kitId}
                  path="templates.homepageHero.subhead"
                  value={data.homepageHero.subhead}
                  canEdit={canEdit}
                  className="text-base text-muted-strong"
                  textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 text-base text-muted-strong focus:outline-none focus:ring-2 focus:ring-accent/30"
                  minRows={2}
                />
                {data.homepageHero.ctaVariants?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {data.homepageHero.ctaVariants.map((cta, idx) => (
                      <span key={idx} className="rounded bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-paper">
                        {cta}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {canEdit ? (
              <ApplyLintBanner
                kitId={kitId}
                result={lint?.homepageHero}
                candidates={[
                  { path: "templates.homepageHero.h1", currentValue: data.homepageHero.h1 },
                  { path: "templates.homepageHero.subhead", currentValue: data.homepageHero.subhead },
                  { path: "templates.homepageHero.eyebrow", currentValue: data.homepageHero.eyebrow },
                ]}
              />
            ) : (
              <LintBanner result={lint?.homepageHero} />
            )}
          </div>
        ) : null}

        {data.coldOutreach ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Cold outreach</p>
            <div className="rounded-lg border border-rule-strong bg-paper-pure p-6 sm:p-8">
              {data.coldOutreach.subjects?.length ? (
                <div className="mb-5">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Subject lines</p>
                  <ul className="space-y-1">
                    {data.coldOutreach.subjects.map((subj, idx) => (
                      <li key={idx} className="font-mono text-sm text-ink before:text-muted before:content-['→_']">
                        {subj}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">Body</p>
              <InlineEditableText
                kitId={kitId}
                path="templates.coldOutreach.body"
                value={data.coldOutreach.body}
                canEdit={canEdit}
                className="whitespace-pre-wrap break-words text-sm text-ink leading-relaxed"
                textareaClassName="w-full min-h-[200px] rounded border border-rule-strong bg-paper-pure p-3 text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30"
                minRows={8}
              />
              {data.coldOutreach.signOff ? (
                <div className="mt-4">
                  <InlineEditableText
                    kitId={kitId}
                    path="templates.coldOutreach.signOff"
                    value={data.coldOutreach.signOff}
                    canEdit={canEdit}
                    className="text-sm text-muted-strong italic"
                    textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 text-sm text-muted-strong italic focus:outline-none focus:ring-2 focus:ring-accent/30"
                    minRows={2}
                  />
                </div>
              ) : null}
            </div>
            {canEdit ? (
              <ApplyLintBanner
                kitId={kitId}
                result={lint?.coldOutreachBody}
                candidates={[
                  {
                    path: "templates.coldOutreach.body",
                    currentValue: data.coldOutreach.body,
                  },
                ]}
              />
            ) : (
              <LintBanner result={lint?.coldOutreachBody} />
            )}
          </div>
        ) : null}

        {data.socialBios ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Social bios</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["linkedin", "twitter", "instagram"] as const).map((platform) =>
                data.socialBios![platform] ? (
                  <div key={platform} className="rounded-lg border border-rule-strong bg-paper-pure p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted capitalize">{platform}</p>
                    <div className="mt-3">
                      <InlineEditableText
                        kitId={kitId}
                        path={`templates.socialBios.${platform}` as const}
                        value={data.socialBios![platform]}
                        canEdit={canEdit}
                        className="text-sm text-ink whitespace-pre-wrap break-words"
                        textareaClassName="w-full rounded border border-rule-strong bg-paper-pure p-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30"
                        minRows={3}
                      />
                    </div>
                  </div>
                ) : null,
              )}
            </div>
            {canEdit ? (
              <ApplyLintBanner
                kitId={kitId}
                result={lint?.linkedinBio}
                candidates={[
                  {
                    path: "templates.socialBios.linkedin",
                    currentValue: data.socialBios!.linkedin,
                  },
                ]}
              />
            ) : (
              <LintBanner result={lint?.linkedinBio} />
            )}
          </div>
        ) : null}

        {data.firstMinute ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">First minute of a sales meeting</p>
            <div className="rounded-lg border border-rule-strong bg-paper-pure p-6 sm:p-8">
              <InlineEditableText
                kitId={kitId}
                path="templates.firstMinute.script"
                value={data.firstMinute.script}
                canEdit={canEdit}
                className="whitespace-pre-wrap break-words text-base text-ink leading-relaxed"
                textareaClassName="w-full min-h-[160px] rounded border border-rule-strong bg-paper-pure p-3 text-base text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30"
                minRows={6}
              />
              {data.firstMinute.wordCount ? (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">~{data.firstMinute.wordCount} words</p>
              ) : null}
            </div>
            {canEdit ? (
              <ApplyLintBanner
                kitId={kitId}
                result={lint?.firstMinute}
                candidates={[
                  {
                    path: "templates.firstMinute.script",
                    currentValue: data.firstMinute.script,
                  },
                ]}
              />
            ) : (
              <LintBanner result={lint?.firstMinute} />
            )}
          </div>
        ) : null}

        {data.emailSignature ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Email signature</p>
            <div className="rounded-lg border border-rule-strong bg-ink p-5">
              <InlineEditableText
                kitId={kitId}
                path="templates.emailSignature"
                value={data.emailSignature}
                canEdit={canEdit}
                className="font-mono text-xs leading-relaxed text-paper whitespace-pre-wrap break-words"
                textareaClassName="w-full rounded border border-paper/30 bg-paper/10 p-2 font-mono text-xs leading-relaxed text-paper focus:outline-none focus:ring-2 focus:ring-accent"
                minRows={4}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
