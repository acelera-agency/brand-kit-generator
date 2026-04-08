"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  content: string;
  streaming: boolean;
};

// Inline markdown styles via Tailwind arbitrary selectors so we don't depend
// on @tailwindcss/typography. Tuned to match the Acelera editorial system.
const MD_STYLES = [
  "text-sm leading-relaxed sm:text-base",
  "[&>*+*]:mt-3",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_em]:italic",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1",
  "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1",
  "[&_li]:marker:text-muted",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-strong",
  "[&_code]:font-mono [&_code]:text-xs [&_code]:bg-paper [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:border [&_code]:border-rule",
  "[&_pre]:font-mono [&_pre]:text-xs [&_pre]:bg-paper [&_pre]:p-3 [&_pre]:border [&_pre]:border-rule [&_pre]:whitespace-pre-wrap [&_pre]:break-words",
  "[&_h1]:font-display [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-ink [&_h1]:mt-4",
  "[&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-4",
  "[&_h3]:font-display [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-3",
  "[&_a]:text-accent [&_a]:underline",
  "[&_hr]:my-4 [&_hr]:border-rule",
  "[&_table]:border [&_table]:border-rule [&_table]:text-xs [&_table]:my-3",
  "[&_th]:border [&_th]:border-rule [&_th]:bg-paper [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-mono [&_th]:uppercase [&_th]:tracking-widest",
  "[&_td]:border [&_td]:border-rule [&_td]:px-2 [&_td]:py-1",
].join(" ");

function BlinkingCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-1 inline-block h-4 w-[2px] -mb-[2px] bg-ink animate-pulse align-middle"
    />
  );
}

export function AssistantBubble({ content, streaming }: Props) {
  return (
    <div className="border border-rule bg-paper p-4 mr-12">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted">
        Generator
      </p>
      {content ? (
        <div className={MD_STYLES}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            skipHtml
            disallowedElements={["script", "iframe", "style"]}
          >
            {content}
          </ReactMarkdown>
          {streaming ? <BlinkingCursor /> : null}
        </div>
      ) : (
        <div className="text-sm text-muted-strong">
          <span>Thinking</span>
          <BlinkingCursor />
        </div>
      )}
    </div>
  );
}
