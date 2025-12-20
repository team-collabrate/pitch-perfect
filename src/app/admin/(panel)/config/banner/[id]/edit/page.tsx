"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

export default function EditBannerPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { language } = useLanguage();
  const strings = allTranslations.admin[language];

  const {
    data: item,
    isLoading,
    refetch,
  } = api.banner.getById.useQuery({ id });
  const deleteMutation = api.banner.delete.useMutation();
  const updateMutation = api.banner.update.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    altText: "",
    displayOrder: 0,
    status: "active" as "active" | "inactive" | "draft",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        altText: item.altText || "",
        displayOrder: item.displayOrder,
        status: item.status,
      });
    }
  }, [item]);

  const handleDelete = async () => {
    await toast.promise(deleteMutation.mutateAsync({ id }), {
      loading: strings.deletingBanner,
      success: strings.bannerDeleted,
      error: strings.bannerDeleteError,
    });

    setShowDeleteDialog(false);
    router.push("/admin/config/banner");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await toast.promise(
        updateMutation.mutateAsync({
          id,
          title: formData.title || undefined,
          description: formData.description || undefined,
          altText: formData.altText || undefined,
          displayOrder: formData.displayOrder,
          status: formData.status,
        }),
        {
          loading: strings.updating,
          success: strings.bannerUpdated,
          error: strings.bannerUpdateError,
        },
      );
      setIsEditing(false);
      refetch();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (item) {
      setFormData({
        title: item.title || "",
        description: item.description || "",
        altText: item.altText || "",
        displayOrder: item.displayOrder,
        status: item.status,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{strings.editBanner}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <p>{strings.loading}</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{strings.editBanner}</h1>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">{strings.bannerNotFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{strings.editBanner}</h1>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          className="flex gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {strings.delete}
        </Button>
      </div>

      <div className="rounded-lg border p-6">
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 font-semibold">{strings.preview}</h2>
            <div className="bg-muted relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={item.cloudinaryUrl}
                alt={item.altText || item.title || "Banner"}
                fill
                className="object-cover"
              />
              {item.mediaType === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <svg
                    className="h-12 w-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{strings.details}</h3>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  {strings.edit}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    {strings.cancel}
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? strings.saving : strings.save}
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <Label
                  htmlFor="title"
                  className="text-muted-foreground text-sm"
                >
                  {strings.title}
                </Label>
                {isEditing ? (
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={strings.titlePlaceholder}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formData.title || "—"}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="description"
                  className="text-muted-foreground text-sm"
                >
                  {strings.description}
                </Label>
                {isEditing ? (
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={strings.descriptionPlaceholder}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">
                    {formData.description || "—"}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="altText"
                  className="text-muted-foreground text-sm"
                >
                  {strings.altText}
                </Label>
                {isEditing ? (
                  <Input
                    id="altText"
                    value={formData.altText}
                    onChange={(e) =>
                      setFormData({ ...formData, altText: e.target.value })
                    }
                    placeholder={strings.altTextPlaceholder}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formData.altText || "—"}</p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="displayOrder"
                  className="text-muted-foreground text-sm"
                >
                  {strings.displayOrder}
                </Label>
                {isEditing ? (
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formData.displayOrder}</p>
                )}
              </div>

              <div>
                <p className="text-muted-foreground text-sm">{strings.type}</p>
                <p className="mt-1 font-medium capitalize">{item.mediaType}</p>
              </div>

              <div>
                <Label
                  htmlFor="status"
                  className="text-muted-foreground text-sm"
                >
                  {strings.status}
                </Label>
                {isEditing ? (
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "active"
                          | "inactive"
                          | "draft",
                      })
                    }
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="active">{strings.active}</option>
                    <option value="inactive">{strings.inactive}</option>
                    <option value="draft">{strings.draft}</option>
                  </select>
                ) : (
                  <p className="mt-1 font-medium capitalize">
                    {formData.status === "active" ? strings.active : formData.status === "inactive" ? strings.inactive : strings.draft}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{strings.deleteBannerItem}</DialogTitle>
            <DialogDescription>
              {item.title
                ? strings.deleteConfirmDesc.replace("{title}", item.title)
                : strings.deleteConfirmDesc.replace("{title}", strings.thisItem)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              {strings.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
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
