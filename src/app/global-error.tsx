"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-page text-ink">
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Tempora could not load</h1>
          <p className="mt-3 text-sm text-mute">
            A serious error stopped the app. Try again in a moment.
          </p>
          <button type="button" className="btn-primary mx-auto mt-8" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
