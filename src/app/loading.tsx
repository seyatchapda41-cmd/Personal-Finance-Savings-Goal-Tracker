import { APP_NAME } from "@/lib/config";

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-page px-4">
      <div
        className="h-8 w-8 animate-pulse rounded-[var(--radius-md)] bg-azure"
        aria-hidden
      />
      <p className="text-sm text-mute">Loading {APP_NAME}…</p>
    </div>
  );
}
