"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export function AdminLoginForm() {
  const router = useRouter();
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.signIn.email({
        email,
        password,
      });
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : strings.loginError,
      );
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          {strings.panelTitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.loginTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {strings.loginDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="admin-email">{strings.email}</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-password">{strings.password}</Label>
            <Link
              href="/admin/forgot-password"
              className="text-xs font-semibold hover:underline"
            >
              {strings.forgot}
            </Link>
          </div>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? strings.loading : strings.loginTitle}
      </Button>
    </form>
  );
}

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          {strings.panelTitle}
        </p>
        <h1 className="text-2xl font-semibold">{strings.loginTitle}</h1>
        <p className="text-muted-foreground text-sm">
          {strings.loginDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="admin-email">{strings.email}</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="admin-password">{strings.password}</Label>
            <Link
              href="/admin/forgot-password"
              className="text-xs font-semibold hover:underline"
            >
              {strings.forgot}
            </Link>
          </div>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {error && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="w-full rounded-2xl py-6 text-base font-semibold"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in…" : strings.loginTitle}
      </Button>
    </form>
  );
}
