"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminReplySupportAction } from "@/app/actions/admin";

export function AdminSupportReplyForm({ ticketRef }: { ticketRef: string }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        setPending(true);
        setError(null);
        formData.set("ref", ticketRef);
        const result = await adminReplySupportAction(formData);
        if (result.error) setError(result.error);
        else {
          if (bodyRef.current) bodyRef.current.value = "";
          router.refresh();
        }
        setPending(false);
      }}
    >
      <label className="block text-sm">
        Reply as customer service
        <textarea
          ref={bodyRef}
          className="ad-input mt-1 min-h-24"
          name="body"
          required
          minLength={2}
          placeholder="Write the answer the client will see."
        />
      </label>
      {error ? (
        <p className="text-sm" style={{ color: "var(--ad-bad)" }}>
          {error}
        </p>
      ) : null}
      <button className="ad-btn ad-btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
