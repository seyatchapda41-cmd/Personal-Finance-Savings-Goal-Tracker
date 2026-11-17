"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replySupportAction } from "@/app/actions/support";
import { VisibleField } from "@/components/visible-field";

export function ClientSupportReplyForm({ ticketRef }: { ticketRef: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

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
          setFormKey((key) => key + 1);
          router.refresh();
        }
        setPending(false);
      }}
    >
      <VisibleField
        key={formKey}
        as="textarea"
        label="Continue this conversation"
        name="body"
        required
        minLength={2}
        placeholder="Add more detail, or reply to customer service."
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
