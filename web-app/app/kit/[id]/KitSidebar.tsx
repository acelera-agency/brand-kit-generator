"use client";

import { useEffect, useRef, useState } from "react";

type TocItem = {
  id: string;
  number: string;
  label: string;
  hasData: boolean;
};

type Props = {
  items: TocItem[];
  passedCount: number;
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function KitSidebarDesktop({ items, passedCount }: Props) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="hidden lg:block" aria-label="Kit sections">
      <div className="sticky top-8 w-[180px]">
        <div className="mb-6">
          <div className="h-1.5 w-full bg-rule">
            <div
              className="h-full bg-accent transition-[width] duration-500"
              style={{ width: `${(passedCount / 9) * 100}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            {passedCount} / 9 stages
          </p>
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => scrollTo(item.id)}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${
                  activeId === item.id ? "text-ink" : "text-muted hover:text-muted-strong"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.hasData ? "bg-accent" : "bg-rule-strong"
                  }`}
                />
                <span className="font-mono text-[10px] uppercase tracking-widest leading-tight">
                  {item.number} {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function KitSidebarMobile({ items, passedCount }: Props) {
  const [activeId, setActiveId] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!activeId || !scrollRef.current) return;
    const btn = scrollRef.current.querySelector(`[data-toc="${activeId}"]`) as HTMLElement;
    if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  return (
    <div className="lg:hidden sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-rule -mx-6 px-4 py-2 sm:-mx-10 sm:px-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 flex-1 bg-rule">
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${(passedCount / 9) * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-muted shrink-0">{passedCount}/9</span>
      </div>
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto scrollbar-none">
        {items.map((item) => (
          <button
            key={item.id}
            data-toc={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
              activeId === item.id
                ? "bg-ink text-paper"
                : "bg-paper-pure border border-rule-strong text-muted hover:text-ink"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                item.hasData ? "bg-accent" : "bg-rule-strong"
              }`}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
