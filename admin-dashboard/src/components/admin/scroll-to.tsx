"use client";

import { useEffect } from "react";

export function ScrollTo({
  targetId,
  trigger,
}: {
  targetId: string;
  trigger: string;
}) {
  useEffect(() => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [targetId, trigger]);

  return null;
}
