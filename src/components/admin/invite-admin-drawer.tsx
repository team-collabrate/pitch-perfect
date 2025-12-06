"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
} from "~/components/ui/drawer";

export function InviteAdminDrawer() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "superAdmin">("admin");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inviteAdminMutation = api.superAdmin.inviteAdmin.useMutation();
  const isPending = inviteAdminMutation.isPending ?? false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await inviteAdminMutation.mutateAsync({
        email,
        name,
        role,
      });

      setSuccess(true);
      setEmail("");
      setName("");
      setRole("admin");

      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to invite admin. Please try again.",
      );
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="w-full rounded-2xl">
          <Plus className="h-4 w-4" />
          Invite new admin
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-4 py-6">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Invite New Admin</h2>
            <p className="text-muted-foreground text-sm">
              Create a new admin account. They will receive an email to set
              their password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                type="text"
                placeholder="John Doe"
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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-role">Role</Label>
              <select
                id="admin-role"
                title="Admin role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "superAdmin")
                }
                className="border-input bg-background rounded-lg border px-3 py-2 text-sm"
                disabled={isPending}
              >
                <option value="admin">Admin</option>
                <option value="superAdmin">Super Admin</option>
              </select>
            </div>

            {error && (
              <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
                {error}
              </p>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700">
                <p className="font-semibold">Invitation sent!</p>
                <p>
                  {name} will receive an email to set their password and get
                  started.
                </p>
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
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 rounded-xl"
                disabled={isPending || success || !email || !name}
              >
                {isPending ? "Inviting..." : "Send Invite"}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
