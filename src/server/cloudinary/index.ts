import cloudinary from "./config";
import {
    imageUploadOptions,
    videoUploadOptions,
    extractPublicId,
    getVideoThumbnail,
    isUploadSuccess,
} from "./utlis";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";

export class CloudinaryService {
    /**
     * Upload an image to Cloudinary
     * @param file - File path or data URI
     */
    static async uploadImage(
        file: string,
        options?: Partial<UploadApiOptions>
    ): Promise<UploadApiResponse> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = await cloudinary.uploader.upload(file, {
                ...imageUploadOptions,
                ...options,
            });

            if (!isUploadSuccess(result)) {
                throw new Error("Upload failed: Invalid response from Cloudinary");
            }

            return result;
        } catch (error) {
            console.error("Error uploading image to Cloudinary:", error);
            throw error;
        }
    }  /**
   * Upload a video to Cloudinary
   * @param file - File path or data URI
   */
    static async uploadVideo(
        file: string,
        options?: Partial<UploadApiOptions>
    ): Promise<UploadApiResponse> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = await cloudinary.uploader.upload(file, {
                ...videoUploadOptions,
                ...options,
            });

            if (!isUploadSuccess(result)) {
                throw new Error("Upload failed: Invalid response from Cloudinary");
            }

            return result;
        } catch (error) {
            console.error("Error uploading video to Cloudinary:", error);
            throw error;
        }
    }  /**
   * Delete a resource from Cloudinary
   */
    static async deleteResource(
        publicId: string,
        resourceType: "image" | "video" = "image"
    ): Promise<{ result: string }> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return result;
        } catch (error) {
            console.error("Error deleting resource from Cloudinary:", error);
            throw error;
        }
    }    /**
     * Delete a resource by URL
     */
    static async deleteByUrl(
        url: string,
        resourceType: "image" | "video" = "image"
    ): Promise<{ result: string }> {
        const publicId = extractPublicId(url);
        if (!publicId) {
            throw new Error("Invalid Cloudinary URL");
        }
        return this.deleteResource(publicId, resourceType);
    }

    /**
     * Get video thumbnail URL
     */
    static getVideoThumbnail(publicId: string): string {
        return getVideoThumbnail(publicId);
    }

    /**
     * Get optimized image URL
     */
    static getOptimizedImageUrl(
        publicId: string,
        width?: number,
        height?: number
    ): string {
        let transformation = "q_auto,f_auto";
        if (width) transformation += `,w_${width}`;
        if (height) transformation += `,h_${height},c_fill`;

        return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
    }
}

export { cloudinary };
export * from "./utlis";
