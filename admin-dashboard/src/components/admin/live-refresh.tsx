"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Reloads the conversation list while Conversations stays open, so a new
// client message appears without a manual refresh.
export function LiveRefresh({ seconds = 8 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  return null;
}
