import { v2 as cloudinary } from "cloudinary";
import { env } from "~/env";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
cloudinary.config({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    api_key: env.CLOUDINARY_API_KEY,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});

export default cloudinary;