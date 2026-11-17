"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EvolutionLines } from "@/components/admin/charts";
import { Icons } from "@/components/admin/icons";
import { Card } from "@/components/admin/ui";
import type { EvolutionReport } from "@/lib/admin/insights";
import { formatMoney } from "@/lib/format";

export function EvolutionBot({
  report,
  reportsHref = "/reports",
}: {
  report: EvolutionReport;
  reportsHref?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReady(true);
      return;
    }
    const timer = window.setTimeout(() => setReady(true), 650);
    return () => window.clearTimeout(timer);
  }, [report.generatedAt]);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="evo-bot-mark grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
            style={{ background: "var(--ad-brand)" }}
            aria-hidden
          >
            <Icons.bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] ad-muted">
              Evolution bot
            </p>
            <h3 className="mt-1 text-lg font-semibold">{report.headline}</h3>
            <p className="ad-soft mt-1 max-w-2xl text-sm">{report.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="ad-badge ad-badge-brand">
            <span className="evo-bot-dot h-1.5 w-1.5 rounded-full" />
            Auto
          </span>
          <Link href={reportsHref} className="ad-btn">
            {reportsHref === "/" ? "Dashboard" : "Reports"}
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <p className="rounded-lg px-3 py-2" style={{ background: "var(--ad-surface-2)" }}>
          <span className="ad-muted block text-xs">Clients now</span>
          <span className="text-lg font-semibold tabular-nums">{report.latestClients}</span>
        </p>
        <p className="rounded-lg px-3 py-2" style={{ background: "var(--ad-surface-2)" }}>
          <span className="ad-muted block text-xs">Collected</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatMoney(report.latestCollected)}
          </span>
        </p>
        <p className="rounded-lg px-3 py-2" style={{ background: "var(--ad-surface-2)" }}>
          <span className="ad-muted block text-xs">Monthly recurring</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatMoney(report.latestMrr)}
          </span>
        </p>
      </div>

      <div className={`mt-5 ${ready ? "evo-chart-ready" : "evo-chart-pending"}`}>
        {ready ? (
          <EvolutionLines points={report.points} />
        ) : (
          <p className="ad-muted flex h-56 items-center text-sm">
            Plotting the last 12 months…
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs ad-muted">
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--ad-brand)" }}
            />
            Clients
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--ad-good)" }}
            />
            Collected revenue
          </span>
        </span>
        <span>Redraws itself every time this page opens.</span>
      </div>
    </Card>
  );
}
