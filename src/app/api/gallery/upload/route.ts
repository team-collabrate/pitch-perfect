import { type NextRequest, NextResponse } from "next/server";
import { CloudinaryService } from "~/server/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const { file, mediaType } = await request.json();

        if (!file || !mediaType) {
            return NextResponse.json(
                { error: "Missing file or mediaType" },
                { status: 400 }
            );
        }

        let result;
        if (mediaType === "image") {
            result = await CloudinaryService.uploadImage(file);
        } else if (mediaType === "video") {
            result = await CloudinaryService.uploadVideo(file);
        } else {
            return NextResponse.json(
                { error: "Invalid mediaType" },
                { status: 400 }
            );
        }

        // Get thumbnail for video
        let thumbnailUrl;
        if (mediaType === "video") {
            thumbnailUrl = CloudinaryService.getVideoThumbnail(result.public_id);
        }

        return NextResponse.json({
            public_id: result.public_id,
            secure_url: result.secure_url,
            thumbnailUrl,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
