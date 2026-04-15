"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
} from "~/components/ui/drawer";

export function InviteAdminDrawer() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState<"admin">("admin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const ctx = api.useContext();
  const inviteAdminMutation = api.superAdmin.inviteAdmin.useMutation({
    onSuccess: async () => {
      try {
        await ctx.superAdmin.adminsList.invalidate();
      } catch (err) {
        // ignore
      }
    },
  });
  const isPending = inviteAdminMutation.isPending ?? false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await inviteAdminMutation.mutateAsync({
        email,
        name,
        password,
        role,
      });

      setSuccess(true);
      setEmail("");
      setName("");
      setPassword("");

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errorInvite);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="w-full rounded-2xl">
          <Plus className="h-4 w-4" />
          {strings.inviteAdmin}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-4 py-6">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">
              {strings.inviteAdminTitle}
            </h2>
            <p className="text-muted-foreground text-sm">
              {strings.inviteAdminDesc}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">{strings.name}</Label>
              <Input
                id="admin-name"
                type="text"
                placeholder={strings.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="e.g. john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {error && (
              <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </p>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
                <p className="font-semibold">{strings.invitationSent}</p>
                <p>{strings.invitationSentDesc.replace("{name}", name)}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={isPending}
                >
                  {strings.cancel}
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={isPending || success || !email || !name || !password}
              >
                {isPending ? strings.inviting : strings.sendInvite}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
