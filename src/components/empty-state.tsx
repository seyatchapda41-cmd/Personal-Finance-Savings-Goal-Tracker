import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="card py-10 text-center">
      <h2 className="font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-mute">{body}</p>
      {href && action ? (
        <Link href={href} className="btn-primary mt-6 inline-flex">
          {action}
        </Link>
      ) : null}
    </div>
  );
}
