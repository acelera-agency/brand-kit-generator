import type { BrandKit } from "@/lib/types";
import { EmptySectionPlaceholder } from "./EmptySectionPlaceholder";

type Props = {
  data: BrandKit["templates"] | undefined;
  kitId: string;
};

export function TemplatesSection({ data, kitId }: Props) {
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
              <div className="p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">{data.homepageHero.eyebrow}</p>
                <h3 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                  {data.homepageHero.h1}
                </h3>
                <p className="mt-4 text-base text-muted-strong">{data.homepageHero.subhead}</p>
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
              <p className="whitespace-pre-wrap break-words text-sm text-ink leading-relaxed">{data.coldOutreach.body}</p>
              {data.coldOutreach.signOff ? (
                <p className="mt-4 text-sm text-muted-strong italic">{data.coldOutreach.signOff}</p>
              ) : null}
            </div>
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
                    <p className="mt-3 text-sm text-ink whitespace-pre-wrap break-words">{data.socialBios![platform]}</p>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ) : null}

        {data.firstMinute ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">First minute of a sales meeting</p>
            <div className="rounded-lg border border-rule-strong bg-paper-pure p-6 sm:p-8">
              <p className="whitespace-pre-wrap break-words text-base text-ink leading-relaxed">{data.firstMinute.script}</p>
              {data.firstMinute.wordCount ? (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">~{data.firstMinute.wordCount} words</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {data.emailSignature ? (
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">Email signature</p>
            <pre className="rounded-lg border border-rule-strong bg-ink p-5 font-mono text-xs leading-relaxed text-paper whitespace-pre-wrap break-words">
              {data.emailSignature}
            </pre>
          </div>
        ) : null}
      </div>
    </section>
  );
}
