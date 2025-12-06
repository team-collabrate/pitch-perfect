"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import { authClient } from "~/server/better-auth/client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
          : "Failed to reset password. The link may have expired. Please request a new one.",
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
            Admin Console
          </p>
          <h1 className="text-2xl font-semibold">Invalid Reset Link</h1>
          <p className="text-muted-foreground text-sm">
            The password reset link is missing or invalid.
          </p>
        </div>

        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          Please request a new password reset link.
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Link
            href="/auth/forgot-password"
            className="font-semibold hover:underline"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          Admin Console
        </p>
        <h1 className="text-2xl font-semibold">Create New Password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your new password below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="new-password">New Password</Label>
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
          <Label htmlFor="confirm-password">Confirm Password</Label>
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
          <p className="font-semibold">Password reset successfully!</p>
          <p>Redirecting you to login...</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full rounded-2xl py-6 text-base font-semibold"
        disabled={isSubmitting || success}
      >
        {isSubmitting ? "Resetting..." : "Reset Password"}
      </Button>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Remember your password?</span>
        <Link href="/admin/login" className="font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
