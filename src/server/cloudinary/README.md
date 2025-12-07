# Cloudinary Service

A TypeScript service for uploading and managing images and videos using Cloudinary in your Next.js application.

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Setup](#setup)
- [Architecture](#architecture)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Features](#features)

---

## 🔧 How It Works

### Architecture Overview

The Cloudinary service is split into three main files:

```
src/server/cloudinary/
├── config.ts       # Cloudinary SDK configuration
├── utlis.ts        # Helper functions and upload options
└── index.ts        # Main service class (CloudinaryService)
```

### 1. **Configuration (`config.ts`)**

Initializes the Cloudinary SDK with your credentials from environment variables:

```typescript
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS URLs
});
```

**Environment Variables Required:**

- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary account name
- `CLOUDINARY_API_KEY` - API key from Cloudinary dashboard
- `CLOUDINARY_API_SECRET` - API secret from Cloudinary dashboard

---

### 2. **Utilities (`utlis.ts`)**

Contains helper functions and default upload configurations:

#### **Image Upload Options**

```typescript
{
  resource_type: "image",
  folder: "pitch-perfect/images",        // Organizes uploads
  transformation: [
    { quality: "auto", fetch_format: "auto" }  // Auto-optimization
  ]
}
```

- Automatically stores images in `pitch-perfect/images/` folder
- `quality: "auto"` - Cloudinary automatically optimizes quality
- `fetch_format: "auto"` - Delivers best format (WebP, AVIF, etc.) based on browser

#### **Video Upload Options**

```typescript
{
  resource_type: "video",
  folder: "pitch-perfect/videos",
  transformation: [
    { quality: "auto" }  // Auto-optimize video quality
  ]
}
```

#### **Helper Functions**

**`extractPublicId(url: string)`**

- Extracts the public_id from a Cloudinary URL
- Used for deleting resources by URL
- Example: `https://res.cloudinary.com/.../v123/folder/image.jpg` → `folder/image`

**`getVideoThumbnail(publicId: string)`**

- Generates a thumbnail URL for videos
- Format: `so_0,w_400,h_300,c_fill` (first frame, 400x300, cropped)

**`isUploadSuccess(result: unknown)`**

- Type guard to verify successful uploads
- Checks for required fields: `public_id` and `secure_url`

---

### 3. **Service Class (`index.ts`)**

The main `CloudinaryService` class provides static methods for all operations:

#### **Upload Flow**

```
User calls uploadImage() or uploadVideo()
         ↓
Apply default options (from utlis.ts)
         ↓
Merge with custom options (if provided)
         ↓
Call Cloudinary SDK uploader.upload()
         ↓
Validate response with isUploadSuccess()
         ↓
Return UploadApiResponse (with secure_url, public_id, etc.)
```

#### **Delete Flow**

```
User calls deleteResource() or deleteByUrl()
         ↓
If URL provided → extract public_id
         ↓
Call Cloudinary SDK uploader.destroy()
         ↓
Return deletion result
```

---

## 🚀 Setup

### 1. Add Environment Variables

Add to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 2. Environment Schema

The service automatically validates environment variables using `src/env.js`:

```typescript
server: {
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
}
```

---

## 📖 Usage Examples

### Upload Image from File Path

```typescript
import { CloudinaryService } from "~/server/cloudinary";

// In a tRPC mutation or API route
const result = await CloudinaryService.uploadImage("/tmp/upload.jpg");

console.log(result.secure_url); // https://res.cloudinary.com/.../image.jpg
console.log(result.public_id); // pitch-perfect/images/xyz123
console.log(result.width); // 1920
console.log(result.height); // 1080
```

### Upload Image from Base64/Data URI

```typescript
// From form data (e.g., uploaded via Next.js API route)
const base64Image = "data:image/png;base64,iVBORw0KGg...";

const result = await CloudinaryService.uploadImage(base64Image);
```

### Upload with Custom Options

```typescript
const result = await CloudinaryService.uploadImage("/path/to/image.jpg", {
  folder: "pitch-perfect/thumbnails", // Custom folder
  public_id: "profile-user-123", // Custom name
  transformation: [
    { width: 500, height: 500, crop: "fill" }, // Resize to 500x500
  ],
  tags: ["profile", "user"], // Add tags for organization
});
```

### Upload Video

```typescript
const result = await CloudinaryService.uploadVideo("/path/to/video.mp4");

console.log(result.secure_url); // Video URL
console.log(result.duration); // Video length in seconds
console.log(result.format); // mp4, mov, etc.

// Get video thumbnail
const thumbnail = CloudinaryService.getVideoThumbnail(result.public_id);
// Returns: https://res.cloudinary.com/.../video/upload/so_0,w_400,h_300,c_fill/xyz.jpg
```

### Delete Resource by public_id

```typescript
await CloudinaryService.deleteResource("pitch-perfect/images/xyz123", "image");

// For videos
await CloudinaryService.deleteResource("pitch-perfect/videos/abc456", "video");
```

### Delete Resource by URL

```typescript
const imageUrl = "https://res.cloudinary.com/.../pitch-perfect/images/xyz.jpg";
await CloudinaryService.deleteByUrl(imageUrl, "image");
```

### Get Optimized Image URL

```typescript
// Get a 800x600 optimized version of an existing image
const url = CloudinaryService.getOptimizedImageUrl(
  "pitch-perfect/images/xyz123",
  800, // width
  600, // height
);

// Returns: https://res.cloudinary.com/.../image/upload/q_auto,f_auto,w_800,h_600,c_fill/pitch-perfect/images/xyz123
```

---

## 📚 API Reference

### `CloudinaryService.uploadImage(file, options?)`

**Parameters:**

- `file: string` - File path or data URI (base64)
- `options?: Partial<UploadApiOptions>` - Optional Cloudinary upload options

**Returns:** `Promise<UploadApiResponse>`

**Response includes:**

- `secure_url` - HTTPS URL of uploaded image
- `public_id` - Unique identifier
- `width`, `height` - Image dimensions
- `format` - File format (jpg, png, etc.)
- `bytes` - File size

---

### `CloudinaryService.uploadVideo(file, options?)`

**Parameters:**

- `file: string` - File path or data URI
- `options?: Partial<UploadApiOptions>` - Optional upload options

**Returns:** `Promise<UploadApiResponse>`

**Response includes:**

- `secure_url` - HTTPS URL of uploaded video
- `public_id` - Unique identifier
- `duration` - Video length in seconds
- `width`, `height` - Video dimensions
- `format` - File format (mp4, mov, etc.)

---

### `CloudinaryService.deleteResource(publicId, resourceType?)`

**Parameters:**

- `publicId: string` - The public_id of the resource
- `resourceType?: "image" | "video"` - Default: `"image"`

**Returns:** `Promise<{ result: string }>`

**Response:** `{ result: "ok" }` on success

---

### `CloudinaryService.deleteByUrl(url, resourceType?)`

**Parameters:**

- `url: string` - Full Cloudinary URL
- `resourceType?: "image" | "video"` - Default: `"image"`

**Returns:** `Promise<{ result: string }>`

---

### `CloudinaryService.getVideoThumbnail(publicId)`

**Parameters:**

- `publicId: string` - The video's public_id

**Returns:** `string` - Thumbnail URL (400x300 JPEG from first frame)

---

### `CloudinaryService.getOptimizedImageUrl(publicId, width?, height?)`

**Parameters:**

- `publicId: string` - The image's public_id
- `width?: number` - Optional width
- `height?: number` - Optional height

**Returns:** `string` - Optimized image URL with transformations

---

## ✨ Features

### Automatic Optimization

- ✅ **Auto Quality** - Cloudinary optimizes quality vs. file size
- ✅ **Auto Format** - Delivers WebP/AVIF when browser supports it
- ✅ **HTTPS Only** - All URLs use secure HTTPS protocol

### Organization

- ✅ **Folder Structure** - Images go to `pitch-perfect/images/`, videos to `pitch-perfect/videos/`
- ✅ **Custom Folders** - Override default folders via options
- ✅ **Tags Support** - Add tags for easier management

### Resource Management

- ✅ **Delete by ID or URL** - Flexible deletion options
- ✅ **Video Thumbnails** - Auto-generate thumbnails from videos
- ✅ **On-the-fly Transformations** - Get resized/cropped versions without re-uploading

### Type Safety

- ✅ **Full TypeScript Support** - All methods are fully typed
- ✅ **Response Types** - Uses official Cloudinary types
- ✅ **Type Guards** - Validates responses at runtime

---

## 🗂️ Folder Organization

```
Cloudinary Dashboard
└── pitch-perfect/
    ├── images/          # All images uploaded via uploadImage()
    │   ├── xyz123.jpg
    │   └── abc456.png
    └── videos/          # All videos uploaded via uploadVideo()
        ├── video1.mp4
        └── video2.mov
```

You can override folders by passing custom options:

```typescript
await CloudinaryService.uploadImage(file, {
  folder: "pitch-perfect/user-avatars",
});
```

---

## 🎯 Best Practices

1. **Always use environment variables** - Never hardcode credentials
2. **Delete old resources** - Clean up unused images/videos to save storage
3. **Use transformations** - Let Cloudinary handle resizing/optimization
4. **Store public_id in database** - Save public_id to easily delete later
5. **Use video thumbnails** - Display thumbnails instead of loading full videos

---

## 🐛 Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await CloudinaryService.uploadImage(file);
} catch (error) {
  // Logs detailed error to console
  // Throws error for handling in your API route/mutation
}
```

Common errors:

- Invalid file path/data URI
- Missing environment variables
- Network issues
- Invalid Cloudinary credentials
- File too large (default limit: 100MB for free tier)
