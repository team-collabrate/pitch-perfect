"use client";

import { useState, useRef, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  thumbnailUrl?: string;
}

interface GalleryUploadProps {
  onUploadSuccess?: () => void;
}

export function GalleryUploadForm({ onUploadSuccess }: GalleryUploadProps) {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    altText: "",
    credits: "",
    phoneNumber: "",
    mediaType: "image" as "image" | "video",
    file: null as File | null,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const createMutation = api.gallery.create.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.file) {
      setError(strings.selectFile);
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;

          // Upload to Cloudinary via API endpoint
          const uploadResponse = await fetch("/api/gallery/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file: base64,
              mediaType: formData.mediaType,
            }),
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload to Cloudinary");
          }

          const cloudinaryResult =
            (await uploadResponse.json()) as CloudinaryUploadResult;

          // Save to database via tRPC
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          await createMutation.mutateAsync({
            title: formData.title || undefined,
            description: formData.description || undefined,
            altText: formData.altText || undefined,
            mediaType: formData.mediaType,
            credits: formData.credits || undefined,
            phoneNumber: formData.phoneNumber || undefined,
            cloudinaryPublicId: cloudinaryResult.public_id,
            cloudinaryUrl: cloudinaryResult.secure_url,
            thumbnailUrl: cloudinaryResult.thumbnailUrl,
            status: "approved",
          });

          setSuccess(true);
          // Reset form
          setFormData({
            title: "",
            description: "",
            altText: "",
            credits: "",
            phoneNumber: "",
            mediaType: "image",
            file: null,
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          setTimeout(() => {
            onUploadSuccess?.();
          }, 1500);
        } catch (error) {
          console.error("Upload error:", error);
          setError(strings.uploadErrorGallery);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(formData.file);
    } catch (error) {
      console.error("Error:", error);
      setError(strings.errorOccurred);
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          {strings.uploadSuccess}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="media-type">{strings.mediaType}</Label>
        <select
          id="media-type"
          title={strings.selectMediaType}
          value={formData.mediaType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              mediaType: e.target.value as "image" | "video",
            }))
          }
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="image">{strings.image}</option>
          <option value="video">{strings.video}</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gallery-file">{strings.file}</Label>
        <Input
          id="file"
          ref={fileInputRef}
          type="file"
          accept={formData.mediaType === "image" ? "image/*" : "video/*"}
          onChange={handleFileChange}
          required
          disabled={isUploading}
        />
        {formData.file && (
          <p className="text-muted-foreground text-xs">{formData.file.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{strings.titleOptional}</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder={strings.titleOptional}
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{strings.descriptionOptional}</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder={strings.descriptionOptional}
          disabled={isUploading}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alt-text">{strings.altTextOptional}</Label>
        <Input
          id="alt-text"
          value={formData.altText}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, altText: e.target.value }))
          }
          placeholder={strings.altTextOptional}
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="credits">{strings.credits}</Label>
        <Input
          id="credits"
          value={formData.credits}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, credits: e.target.value }))
          }
          placeholder={strings.credits}
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone-number">{strings.phoneNumber}</Label>
        <Input
          id="phone-number"
          value={formData.phoneNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
          }
          placeholder={strings.phoneNumber}
          disabled={isUploading}
        />
      </div>

      <Button type="submit" disabled={isUploading} className="w-full">
        {isUploading ? strings.uploading : strings.upload}
      </Button>
    </form>
  );
}
