"use client";

import { ResetPasswordForm } from "~/components/admin/reset-password-form";
import { Suspense, useMemo } from "react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  return (
    <div className="bg-background flex min-h-dvh items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="flex w-full items-center justify-center py-12">
            <p>{strings.loading}</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
