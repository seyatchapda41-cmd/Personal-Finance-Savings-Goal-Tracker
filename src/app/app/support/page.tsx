import { ClientSupportThreads } from "@/components/client-support-threads";
import { LiveRefresh } from "@/components/live-refresh";
import { SupportRequestForm } from "@/components/support-request-form";
import { loadClientSupportThreads } from "@/lib/support-inbox";

export default async function SupportPage() {
  const threads = await loadClientSupportThreads();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-sm text-mute">Customer service</p>
        <h1 className="mt-1 text-3xl font-semibold">Ask for help</h1>
        <p className="mt-2 text-sm text-mute">
          Write to customer service, then keep the conversation here. The
          founder answers from the admin Conversations page, and a reply
          appears here while this page stays open.
        </p>
      </header>

      <LiveRefresh />
      <ClientSupportThreads threads={threads} />
      <SupportRequestForm />
    </div>
  );
}
