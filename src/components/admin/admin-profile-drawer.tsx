"use client";

import { useState } from "react";
import { Loader2, LogOut, Settings, Trash2, Edit2, X } from "lucide-react";

import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose,
  DrawerTitle,
} from "~/components/ui/drawer";

interface AdminProfileDrawerProps {
  adminId: number;
  adminName: string;
}

export function AdminProfileDrawer({
  adminId,
  adminName,
}: AdminProfileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(adminName);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = api.useUtils();

  // Fetch admin profile
  const { data: profile, isLoading } = api.superAdmin.getAdminProfile.useQuery(
    { managerId: adminId },
    { enabled: open },
  );

  // Mutations
  const removeAllSessionsMutation =
    api.superAdmin.removeAllSessions.useMutation({
      onSuccess: () => {
        setSuccessMessage("All sessions removed successfully");
        setTimeout(() => setSuccessMessage(null), 2000);
      },
      onError: (error) => {
        setError(error.message || "Failed to remove sessions");
      },
    });

  const removeAdminMutation = api.superAdmin.removeAdmin.useMutation({
    onSuccess: () => {
      setSuccessMessage("Admin removed successfully");
      setTimeout(() => {
        setOpen(false);
        void utils.superAdmin.adminsList.invalidate();
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || "Failed to remove admin");
    },
  });

  const updateNameMutation = api.superAdmin.updateAdminName.useMutation({
    onSuccess: (_data) => {
      setSuccessMessage("Name updated successfully");
      setEditingName(false);
      void utils.superAdmin.getAdminProfile.invalidate();
      setTimeout(() => setSuccessMessage(null), 2000);
    },
    onError: (error) => {
      setError(error.message || "Failed to update name");
    },
  });

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    setError(null);
    await updateNameMutation.mutateAsync({
      managerId: adminId,
      name: newName.trim(),
    });
  };

  const handleRemoveAllSessions = async () => {
    if (!confirm("Remove all active sessions for this admin?")) return;
    await removeAllSessionsMutation.mutateAsync({ managerId: adminId });
  };

  const handleRemoveAdmin = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${adminName}? This action cannot be undone.`,
      )
    )
      return;
    await removeAdminMutation.mutateAsync({ managerId: adminId });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary h-9 w-9 rounded-full p-0 transition-colors"
          title="View profile"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-4 py-6">
        <DrawerTitle className="sr-only">Admin Profile</DrawerTitle>
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Admin Profile</h2>
              <p className="text-muted-foreground text-sm">
                Manage admin account
              </p>
            </div>
            <DrawerClose asChild>
              <button className="hover:bg-muted rounded-lg p-1" title="Close">
                <X className="h-5 w-5" />
              </button>
            </DrawerClose>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
                  {successMessage}
                </div>
              )}

              {/* Admin Info Section */}
              <div className="border-border/60 bg-card/30 space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    Name
                  </Label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter new name"
                        disabled={updateNameMutation.isPending}
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateName}
                        disabled={updateNameMutation.isPending}
                      >
                        {updateNameMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingName(false);
                          setNewName(profile.name);
                        }}
                        disabled={updateNameMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{profile.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingName(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    Email
                  </Label>
                  <p className="font-medium">{profile.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    Role
                  </Label>
                  <p className="font-medium capitalize">{profile.role}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    Member Since
                  </Label>
                  <p className="font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Sessions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-muted-foreground text-sm">
                      {profile.activeSessionsCount} session
                      {profile.activeSessionsCount !== 1 ? "s" : ""} active
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveAllSessions}
                    disabled={
                      removeAllSessionsMutation.isPending ||
                      profile.activeSessionsCount === 0
                    }
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {removeAllSessionsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        <span className="ml-2 hidden sm:inline">
                          Remove All
                        </span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Sessions List */}
                {profile.sessions.length > 0 && (
                  <div className="border-border/40 bg-card/20 max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                    {profile.sessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="border-border/40 bg-card/50 flex flex-col gap-1 rounded border p-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-mono">
                            {sess.userAgent?.substring(0, 40)}...
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(sess.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                        {sess.ipAddress && (
                          <span className="text-muted-foreground font-mono">
                            {sess.ipAddress}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-border/40 space-y-2 border-t pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRemoveAdmin}
                  disabled={removeAdminMutation.isPending}
                >
                  {removeAdminMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Admin
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
