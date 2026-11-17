export function Notice({
  children,
  tone = "good",
}: {
  children: React.ReactNode;
  tone?: "good" | "bad";
}) {
  return (
    <p
      role="status"
      className={`rounded-[var(--radius-md)] px-3 py-2 text-sm ${
        tone === "bad"
          ? "bg-danger/10 text-danger"
          : "bg-success/10 text-success"
      }`}
    >
      {children}
    </p>
  );
}
