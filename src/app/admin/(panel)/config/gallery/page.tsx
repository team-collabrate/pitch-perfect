"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";

import { GalleryUploadForm } from "~/components/admin/gallery-upload-form";
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
import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

export default function AdminGalleryPage() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const {
    data: galleryItems,
    isLoading,
    refetch,
  } = api.gallery.getAllAdmin.useQuery();

  const { data: editItem, isLoading: isEditLoading } =
    api.gallery.getById.useQuery(
      { id: editId ?? 0 },
      {
        enabled: editId !== null,
      },
    );

  const deleteMutation = api.gallery.delete.useMutation();
  const toggleActiveMutation = api.gallery.toggleActive.useMutation();
  const updateMutation = api.gallery.update.useMutation();

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    altText: "",
    displayOrder: 0,
    credits: "",
    status: "approved" as "approved" | "inactive" | "discarded",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editItem) return;
    setEditForm({
      title: editItem.title ?? "",
      description: editItem.description ?? "",
      altText: editItem.altText ?? "",
      displayOrder: editItem.displayOrder,
      credits: editItem.credits ?? "",
      status: editItem.status,
    });
  }, [editItem]);

  const confirmDelete = async () => {
    if (!deleteItem) return;

    const p = deleteMutation.mutateAsync({ id: deleteItem.id });
    void toast.promise(p, {
      loading: "Deleting gallery item...",
      success: "Gallery item deleted",
      error: "Failed to delete gallery item",
    });
    await p;

    setDeleteItem(null);
    void refetch();
  };

  const handleToggleActive = async (ids: number[], isActive: boolean) => {
    const p = toggleActiveMutation.mutateAsync({ ids, isActive });
    void toast.promise(p, {
      loading: `Updating ${ids.length} item(s)...`,
      success: `Gallery items ${isActive ? "activated" : "deactivated"}`,
      error: "Failed to update gallery items",
    });
    await p;

    void refetch();
  };

  const handleSaveEdit = async () => {
    if (editId === null) return;

    setIsSaving(true);
    try {
      const p = updateMutation.mutateAsync({
        id: editId,
        title: editForm.title || undefined,
        description: editForm.description || undefined,
        altText: editForm.altText || undefined,
        displayOrder: editForm.displayOrder,
        credits: editForm.credits || undefined,
        status: editForm.status,
      });
      void toast.promise(p, {
        loading: "Updating gallery item...",
        success: "Gallery item updated",
        error: "Failed to update gallery item",
      });
      await p;
      setEditId(null);
      void refetch();
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{strings.galleryTitle}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{strings.galleryTitle}</h1>
        <Button onClick={() => setShowUploadForm(true)} size="sm">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{strings.galleryTitle}</DialogTitle>
            <DialogDescription>
              Add new images or videos to the gallery
            </DialogDescription>
          </DialogHeader>
          <GalleryUploadForm
            onUploadSuccess={() => {
              setShowUploadForm(false);
              void refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      {!galleryItems || galleryItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">
            No gallery items yet. Upload one to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Preview
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Title
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Order
                    </th>
                    <th className="px-2 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {galleryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                      <td className="px-2 py-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={
                              item.mediaType === "video" && item.thumbnailUrl
                                ? item.thumbnailUrl
                                : item.cloudinaryUrl
                            }
                            alt={item.altText ?? item.title ?? ""}
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
                          <p className="truncate font-medium">{item.title}</p>
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
                          ) : (
                            <FileText className="h-5 w-5 text-purple-600" />
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="flex items-center justify-center">
                          {item.isActive ? (
                            <Check className="h-5 w-5 text-green-600" />
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setEditId(item.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              setDeleteItem({
                                id: item.id,
                                title: item.title ?? "",
                              })
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
            <h3 className="font-semibold">Bulk Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleActive(
                    galleryItems.map((item) => item.id),
                    true,
                  )
                }
              >
                Activate All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleToggleActive(
                    galleryItems.map((item) => item.id),
                    false,
                  )
                }
              >
                Deactivate All
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
            <DialogTitle>Delete gallery item</DialogTitle>
            <DialogDescription>
              {deleteItem
                ? `Are you sure you want to delete “${deleteItem.title}”? This action cannot be undone.`
                : "Are you sure you want to delete this item?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteItem(null)}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer
        open={editId !== null}
        onOpenChange={(open) => {
          if (!open) setEditId(null);
        }}
      >
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <DrawerTitle>Edit gallery item</DrawerTitle>
            <DrawerDescription>Update details and status</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 pt-4 pb-4">
            {isEditLoading || !editItem ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold">Preview</p>
                  <div className="bg-muted relative mt-2 h-56 w-full overflow-hidden rounded-lg">
                    <Image
                      src={
                        editItem.mediaType === "video" && editItem.thumbnailUrl
                          ? editItem.thumbnailUrl
                          : editItem.cloudinaryUrl
                      }
                      alt={editItem.altText ?? editItem.title ?? ""}
                      fill
                      className="object-cover"
                    />
                    {editItem.mediaType === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <svg
                          className="h-10 w-10 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="edit-title"
                      className="text-muted-foreground text-sm"
                    >
                      Title (optional)
                    </Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Gallery item title (optional)"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-description"
                      className="text-muted-foreground text-sm"
                    >
                      Description
                    </Label>
                    <Input
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Gallery item description"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-altText"
                      className="text-muted-foreground text-sm"
                    >
                      Alt Text
                    </Label>
                    <Input
                      id="edit-altText"
                      value={editForm.altText}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          altText: e.target.value,
                        }))
                      }
                      placeholder="Alt text for accessibility"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-displayOrder"
                      className="text-muted-foreground text-sm"
                    >
                      Display Order
                    </Label>
                    <Input
                      id="edit-displayOrder"
                      type="number"
                      value={editForm.displayOrder}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          displayOrder: parseInt(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-credits"
                      className="text-muted-foreground text-sm"
                    >
                      Credits
                    </Label>
                    <Input
                      id="edit-credits"
                      value={editForm.credits}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          credits: e.target.value,
                        }))
                      }
                      placeholder="Photo/Video credits"
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <p className="text-muted-foreground text-sm">Type</p>
                    <p className="mt-1 font-medium capitalize">
                      {editItem.mediaType}
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-status"
                      className="text-muted-foreground text-sm"
                    >
                      Status
                    </Label>
                    <select
                      id="edit-status"
                      aria-label="Status"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          status: e.target.value as
                            | "approved"
                            | "inactive"
                            | "discarded",
                        }))
                      }
                      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSaving}
                    >
                      <option value="approved">Active (Approved)</option>
                      <option value="inactive">Inactive</option>
                      <option value="discarded">Discarded</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DrawerFooter className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditId(null)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving || isEditLoading || !editItem}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
