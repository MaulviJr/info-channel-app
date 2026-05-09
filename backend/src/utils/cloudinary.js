import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, options = {}) => {
  return cloudinary.uploader.upload(filePath, {
    folder: process.env.CLOUDINARY_FOLDER || "info-channel",
    resource_type: "image",
    ...options,
  });
};

export { cloudinary, uploadImage };
