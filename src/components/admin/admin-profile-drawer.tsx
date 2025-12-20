"use client";

import { useState, useMemo } from "react";
import { Loader2, LogOut, Settings, Trash2, Edit2, X } from "lucide-react";

import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
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
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
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
        setSuccessMessage(strings.profileSessionsRemoved);
        setTimeout(() => setSuccessMessage(null), 2000);
      },
      onError: (error) => {
        setError(error.message || strings.profileErrorRemoveSessions);
      },
    });

  const removeAdminMutation = api.superAdmin.removeAdmin.useMutation({
    onSuccess: () => {
      setSuccessMessage(strings.profileAdminRemoved);
      setTimeout(() => {
        setOpen(false);
        void utils.superAdmin.adminsList.invalidate();
      }, 2000);
    },
    onError: (error) => {
      setError(error.message || strings.profileErrorRemoveAdmin);
    },
  });

  const updateNameMutation = api.superAdmin.updateAdminName.useMutation({
    onSuccess: (_data) => {
      setSuccessMessage(strings.profileNameUpdated);
      setEditingName(false);
      void utils.superAdmin.getAdminProfile.invalidate();
      setTimeout(() => setSuccessMessage(null), 2000);
    },
    onError: (error) => {
      setError(error.message || strings.profileErrorUpdateName);
    },
  });

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setError(strings.profileNameEmpty);
      return;
    }

    setError(null);
    await updateNameMutation.mutateAsync({
      managerId: adminId,
      name: newName.trim(),
    });
  };

  const handleRemoveAllSessions = async () => {
    if (!confirm(strings.profileConfirmRemoveSessions)) return;
    await removeAllSessionsMutation.mutateAsync({ managerId: adminId });
  };

  const handleRemoveAdmin = async () => {
    if (!confirm(strings.profileConfirmDelete)) return;
    await removeAdminMutation.mutateAsync({ managerId: adminId });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary h-9 w-9 rounded-full p-0 transition-colors"
          title={strings.viewProfile}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-4 py-6">
        <DrawerTitle className="sr-only">{strings.profileTitle}</DrawerTitle>
        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{strings.profileTitle}</h2>
              <p className="text-muted-foreground text-sm">
                {strings.profileDesc}
              </p>
            </div>
            <DrawerClose asChild>
              <button className="hover:bg-muted rounded-lg p-1" title={strings.close}>
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
                    {strings.profileName}
                  </Label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={strings.profileNamePlaceholder}
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
                          strings.save
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
                        {strings.cancel}
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
                    {strings.profileEmail}
                  </Label>
                  <p className="font-medium">{profile.email}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    {strings.profileRole}
                  </Label>
                  <p className="font-medium capitalize">{profile.role}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">
                    {strings.profileMemberSince}
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
                    <p className="font-medium">{strings.profileActiveSessions}</p>
                    <p className="text-muted-foreground text-sm">
                      {profile.activeSessionsCount}{" "}
                      {profile.activeSessionsCount !== 1
                        ? strings.profileSessions
                        : strings.profileSession}{" "}
                      {strings.profileActive}
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
                          {strings.profileRemoveAll}
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
                  {strings.profileDeleteAdmin}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
