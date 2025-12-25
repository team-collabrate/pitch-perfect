import { type NextRequest, NextResponse } from "next/server";

import { CloudinaryService } from "~/server/cloudinary";

export async function POST(request: NextRequest) {
    try {
        const { file, mediaType } = await request.json();

        if (!file || !mediaType) {
            return NextResponse.json({ error: "Missing file or mediaType" }, { status: 400 });
        }

        let result;
        if (mediaType === "video") {
            result = await CloudinaryService.uploadVideo(file);
        } else if (mediaType === "image" || mediaType === "gif") {
            result = await CloudinaryService.uploadImage(file);
        } else {
            return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
        }

        return NextResponse.json({
            public_id: result.public_id,
            secure_url: result.secure_url,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
