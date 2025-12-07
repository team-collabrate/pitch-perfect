"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { GalleryUploadForm } from "~/components/admin/gallery-upload-form";

export default function AdminGalleryPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);

  const {
    data: galleryItems,
    isLoading,
    refetch,
  } = api.gallery.getAllAdmin.useQuery();
  const deleteMutation = api.gallery.delete.useMutation();
  const toggleActiveMutation = api.gallery.toggleActive.useMutation();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      alert("Gallery item deleted successfully");
      refetch();
    } catch (error) {
      alert("Failed to delete gallery item");
    }
  };

  const handleToggleActive = async (ids: number[], isActive: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ ids, isActive });
      alert(`Gallery items ${isActive ? "activated" : "deactivated"}`);
      refetch();
    } catch (error) {
      alert("Failed to update gallery items");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gallery Management</h1>
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
        <h1 className="text-3xl font-bold">Gallery Management</h1>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? "Cancel" : "Upload New"}
        </Button>
      </div>

      {showUploadForm && (
        <GalleryUploadForm
          onUploadSuccess={() => {
            setShowUploadForm(false);
            refetch();
          }}
        />
      )}

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
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Preview
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {galleryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50 border-b">
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded">
                          <Image
                            src={
                              item.mediaType === "video" && item.thumbnailUrl
                                ? item.thumbnailUrl
                                : item.cloudinaryUrl
                            }
                            alt={item.altText || item.title}
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
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="truncate font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-muted-foreground truncate text-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            item.mediaType === "image"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {item.mediaType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant={item.isActive ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            handleToggleActive([item.id], !item.isActive)
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Button>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {item.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
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
    </div>
  );
}
