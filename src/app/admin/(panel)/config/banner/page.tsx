"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Video,
  Image as ImageIcon,
  Edit,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";

import { BannerUploadForm } from "~/components/admin/banner-upload-form";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export default function AdminBannerPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    title: string | null;
  } | null>(null);

  const {
    data: bannerItems,
    isLoading,
    refetch,
  } = api.banner.getAllAdmin.useQuery();
  const deleteMutation = api.banner.delete.useMutation();
  const toggleActiveMutation = api.banner.toggleActive.useMutation();

  const confirmDelete = async () => {
    if (!deleteItem) return;

    const p = deleteMutation.mutateAsync({ id: deleteItem.id });
    void toast.promise(p, {
      loading: strings.deletingBanner,
      success: strings.bannerDeleted,
      error: strings.bannerDeleteError,
    });
    await p;

    setDeleteItem(null);
    void refetch();
  };

  const handleToggleActive = async (ids: number[], isActive: boolean) => {
    const p = toggleActiveMutation.mutateAsync({ ids, isActive });
    void toast.promise(p, {
      loading: strings.updatingItems.replace("{count}", ids.length.toString()),
      success: isActive ? strings.bannerActivated : strings.bannerDeactivated,
      error: strings.bannerUpdateError,
    });
    await p;

    void refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{strings.bannerTitle}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <p>{strings.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{strings.bannerTitle}</h1>
        <Button onClick={() => setShowUploadForm(true)} size="sm">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{strings.bannerTitle}</DialogTitle>
            <DialogDescription>{strings.bannerUploadDesc}</DialogDescription>
          </DialogHeader>
          <BannerUploadForm
            onUploadSuccess={() => {
              setShowUploadForm(false);
              void refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {!bannerItems || bannerItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">{strings.noBannerItems}</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.preview}
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.title}
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.type}
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.status}
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.order}
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      {strings.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bannerItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                      <td className="px-2 py-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={item.cloudinaryUrl}
                            alt={item.altText ?? item.title ?? "Banner"}
                            fill
                            className="object-cover"
                          />
                          {item.mediaType === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <svg
                                className="h-6 w-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="max-w-xs">
                          <p className="truncate font-medium">
                            {item.title ?? strings.untitled}
                          </p>
                          {item.description && (
                            <p className="text-muted-foreground truncate text-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className="flex items-center justify-center">
                          {item.mediaType === "image" ? (
                            <ImageIcon className="h-5 w-5 text-blue-600" />
                          ) : item.mediaType === "video" ? (
                            <Video className="h-5 w-5 text-purple-600" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-green-600" />
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="flex items-center justify-center">
                          {item.status === "active" ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : item.status === "draft" ? (
                            <span className="text-muted-foreground text-xs">
                              {strings.draft}
                            </span>
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </span>
                      </td>
                      <td className="text-muted-foreground px-2 py-3 text-sm">
                        {item.displayOrder}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-2">
                          <Link href={`/admin/config/banner/${item.id}/edit`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              setDeleteItem({ id: item.id, title: item.title })
                            }
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-semibold">{strings.bulkActions}</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleActive(
                    bannerItems.map((item) => item.id),
                    true,
                  )
                }
              >
                {strings.activateAll}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleActive(
                    bannerItems.map((item) => item.id),
                    false,
                  )
                }
              >
                {strings.deactivateAll}
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog
        open={deleteItem !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.deleteBannerItem}</DialogTitle>
            <DialogDescription>
              {deleteItem
                ? strings.deleteConfirmDesc.replace(
                    "{title}",
                    deleteItem.title ?? strings.thisItem,
                  )
                : strings.deleteConfirmDesc.replace(
                    "{title}",
                    strings.thisItem,
                  )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteItem(null)}
              disabled={deleteMutation.isPending}
            >
              {strings.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? strings.deleting : strings.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
