"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export function ForgotPasswordForm() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : strings.errorReset,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          {strings.panelTitle}
        </p>
        <h1 className="text-2xl font-semibold">
          {strings.forgotPasswordTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {strings.forgotDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forgot-email">{strings.email}</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            disabled={success}
          />
        </div>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {success && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          <p className="font-semibold">{strings.checkEmail}</p>
          <p>
            {strings.resetLinkSent.replace("{email}", email)}
          </p>
        </div>
      )}

      {!success && (
        <Button
          type="submit"
          className="w-full rounded-2xl py-6 text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? strings.sending : strings.forgotPasswordTitle}
        </Button>
      )}

      <div className="text-center">
        <Link
          href="/admin/login"
          className="text-muted-foreground text-sm font-medium hover:underline"
        >
          {strings.backToLogin}
        </Link>
      </div>
    </form>
  );
}
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          {strings.panelTitle}
        </p>
        <h1 className="text-2xl font-semibold">
          {strings.forgotPasswordTitle}
        </h1>
        <p className="text-muted-foreground text-sm">
          {strings.forgotDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forgot-email">{strings.email}</Label>
          <Input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            disabled={success}
          />
        </div>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {success && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
          <p className="font-semibold">{strings.checkEmail}</p>
          <p>
            {strings.resetLinkSent.replace("{email}", email)}
          </p>
        </div>
      )}

      {!success && (
        <Button
          type="submit"
          className="w-full rounded-2xl py-6 text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? strings.sending : strings.forgotPasswordTitle}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">{strings.rememberPassword}</span>
        <Link href="/admin/login" className="font-semibold hover:underline">
          {strings.signIn}
        </Link>
      </div>
    </form>
  );
}
