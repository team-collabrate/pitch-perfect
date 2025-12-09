"use client";

import { useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

interface BannerUploadProps {
  onUploadSuccess?: () => void;
}

export function BannerUploadForm({ onUploadSuccess }: BannerUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    altText: "",
    mediaType: "image" as "image" | "video" | "gif",
    file: null as File | null,
  });

  const createMutation = api.banner.create.useMutation();

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

    if (!formData.file || !formData.title) {
      setError("Please select a file and enter a title");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;

          const uploadResponse = await fetch("/api/banner/upload", {
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

          await createMutation.mutateAsync({
            title: formData.title,
            description: formData.description || undefined,
            altText: formData.altText || undefined,
            mediaType: formData.mediaType,
            cloudinaryPublicId: cloudinaryResult.public_id,
            cloudinaryUrl: cloudinaryResult.secure_url,
            status: "active",
          });

          setSuccess(true);
          setFormData({
            title: "",
            description: "",
            altText: "",
            mediaType: "image",
            file: null,
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }

          setTimeout(() => {
            onUploadSuccess?.();
          }, 1200);
        } catch (err) {
          console.error("Upload error:", err);
          setError("Failed to upload banner");
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(formData.file);
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred");
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
          Banner uploaded successfully!
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="media-type">Media Type</Label>
        <select
          id="media-type"
          title="Select media type"
          value={formData.mediaType}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              mediaType: e.target.value as "image" | "video" | "gif",
            }))
          }
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isUploading}
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="gif">GIF</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">File</Label>
        <Input
          id="file"
          ref={fileInputRef}
          type="file"
          accept={formData.mediaType === "video" ? "video/*" : "image/*"}
          onChange={handleFileChange}
          required
          disabled={isUploading}
        />
        {formData.file && (
          <p className="text-muted-foreground text-xs">{formData.file.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="Banner title"
          required
          disabled={isUploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Describe the banner"
          disabled={isUploading}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="alt-text">Alt Text (Optional)</Label>
        <Input
          id="alt-text"
          value={formData.altText}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, altText: e.target.value }))
          }
          placeholder="Alternative text for accessibility"
          disabled={isUploading}
        />
      </div>

      <Button type="submit" disabled={isUploading} className="w-full">
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
