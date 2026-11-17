import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recover access"
      description="Enter the phone number on your account. Customer service checks the request and sets a new password for you, then passes it on."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
