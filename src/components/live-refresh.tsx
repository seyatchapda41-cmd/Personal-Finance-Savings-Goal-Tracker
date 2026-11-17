"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Reloads the server data while this page stays open, so a reply from the
// other app shows up without a manual refresh.
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
