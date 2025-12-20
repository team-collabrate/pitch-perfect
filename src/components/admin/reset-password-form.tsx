"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(strings.errorToken);
      return;
    }

    if (password !== confirmPassword) {
      setError(strings.errorMatch);
      return;
    }

    if (password.length < 8) {
      setError(strings.errorLength);
      return;
    }

    setIsSubmitting(true);

    try {
      await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/login");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : strings.errorResetFailed,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            {strings.panelTitle}
          </p>
          <h1 className="text-2xl font-semibold">
            {strings.resetPasswordTitle}
          </h1>
          <p className="text-muted-foreground text-sm">
            {strings.missingToken}
          </p>
        </div>

        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          {strings.errorToken}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Link
            href="/admin/forgot-password"
            className="font-semibold hover:underline"
          >
            {strings.requestNewLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          {strings.panelTitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.resetPasswordTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {strings.resetDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="reset-password">{strings.newPassword}</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            disabled={success}
          />
          <p className="text-muted-foreground text-xs">
            Must be at least 8 characters long.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="confirm-password">{strings.confirmPassword}</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="••••••••"
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
          <p className="font-semibold">{strings.resetSuccess}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full rounded-2xl py-6 text-base font-semibold"
        disabled={isSubmitting || success}
      >
        {isSubmitting ? strings.resetting : strings.resetPasswordTitle}
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">{strings.rememberPassword}</span>
        <Link href="/admin/login" className="font-semibold hover:underline">
          {strings.signIn}
        </Link>
      </div>
    </form>
  );
}
