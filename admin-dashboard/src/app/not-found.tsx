import Link from "next/link";
import { BrandMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="admin mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16 text-center">
      <div className="flex justify-center">
        <BrandMark size={40} />
      </div>
      <p className="mt-10 text-sm font-medium uppercase tracking-[0.16em] text-azure">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold">This page is not here</h1>
      <p className="mt-3 text-sm text-mute">
        That address is not a page in the control panel.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/login" className="btn-primary">
          Staff sign in
        </Link>
      </div>
    </div>
  );
}
