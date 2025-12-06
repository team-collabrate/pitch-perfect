"use client";

import { useState } from "react";
import Link from "next/link";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function ForgotPasswordForm() {
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
          : "Failed to send password reset email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          Admin Console
        </p>
        <h1 className="text-2xl font-semibold">Reset Your Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="forgot-email">Email</Label>
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
        <div className="border-green-500/40 bg-green-500/10 text-green-700 rounded-2xl border px-3 py-2 text-sm">
          <p className="font-semibold">Check your email</p>
          <p>
            We sent a password reset link to <strong>{email}</strong>. Please check
            your email and follow the link to reset your password.
          </p>
        </div>
      )}

      {!success && (
        <Button
          type="submit"
          className="w-full rounded-2xl py-6 text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>
      )}

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Remember your password?</span>
        <Link href="/admin/login" className="font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
