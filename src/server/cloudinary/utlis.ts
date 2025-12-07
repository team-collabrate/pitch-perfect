import type {
    UploadApiOptions,
    UploadApiResponse,
} from "cloudinary";

/**
 * Upload options for images
 */
export const imageUploadOptions: UploadApiOptions = {
    resource_type: "image",
    folder: "pitch-perfect/images",
    transformation: [
        { quality: "auto", fetch_format: "auto" },
    ],
};

/**
 * Upload options for videos
 */
export const videoUploadOptions: UploadApiOptions = {
    resource_type: "video",
    folder: "pitch-perfect/videos",
    transformation: [
        { quality: "auto" },
    ],
};

/**
 * Extract public_id from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
    try {
        const regex = /\/v\d+\/(.+)\.\w+$/;
        const match = regex.exec(url);
        return match?.[1] ?? null;
    } catch {
        return null;
    }
}/**
 * Generate thumbnail URL for videos
 */
export function getVideoThumbnail(publicId: string): string {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_0,w_400,h_300,c_fill/${publicId}.jpg`;
}

/**
 * Type guard for upload response
 */
export function isUploadSuccess(
    result: unknown
): result is UploadApiResponse {
    return (
        typeof result === "object" &&
        result !== null &&
        "public_id" in result &&
        "secure_url" in result &&
        typeof (result as Record<string, unknown>).public_id === "string" &&
        typeof (result as Record<string, unknown>).secure_url === "string"
    );
}