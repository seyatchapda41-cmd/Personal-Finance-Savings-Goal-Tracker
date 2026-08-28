"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { replySupportAction } from "@/app/actions/support";

export function ClientSupportReplyForm({ ticketRef }: { ticketRef: string }) {
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
        const result = await replySupportAction(formData);
        if (result.error) setError(result.error);
        else {
          if (bodyRef.current) bodyRef.current.value = "";
          router.refresh();
        }
        setPending(false);
      }}
    >
      <label className="block text-sm">
        Continue this conversation
        <textarea
          ref={bodyRef}
          className="input mt-1 min-h-24"
          name="body"
          required
          minLength={2}
          placeholder="Add more detail, or reply to customer service."
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
