export default function AppLoading() {
  return (
    <div className="space-y-4 p-4 sm:p-8">
      <div className="h-7 w-40 animate-pulse rounded-[var(--radius-md)] bg-sand" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-sand"
          />
        ))}
      </div>
      <p className="text-sm text-mute">Loading your books…</p>
    </div>
  );
}
