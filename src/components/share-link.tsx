"use client";

import { useState } from "react";

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input
        readOnly
        value={url}
        aria-label="Link to send"
        className="min-w-0 flex-1 rounded-lg border border-line bg-page px-3 py-2 text-sm"
        onFocus={(event) => event.currentTarget.select()}
      />
      <button type="button" className="btn-primary shrink-0" onClick={copy}>
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
