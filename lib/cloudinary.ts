import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// The client uploads the image bytes directly to Cloudinary using
// this signature — our server never proxies binary image data
// (architecture.md: file storage holds binaries, the DB holds
// references; this keeps our own API server out of that path too).
export function createUploadSignature() {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = "affiliate-marketplace/products";
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET ?? "",
  );

  return {
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  };
}
