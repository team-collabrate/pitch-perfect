import { ResetPasswordForm } from "~/components/admin/reset-password-form";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-center py-12">
            <p>Loading...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
