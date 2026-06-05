import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const uploadImage = async (localFilePath)=>{
  try {
    
      if(!localFilePath) return null;
      const response = await cloudinary.uploader.upload(localFilePath,{
    resource_type:"auto"
})
 fs.unlinkSync(localFilePath);
    return response;
    } catch (error) {
      console.log("Couldn't upload for some reasons: ", error);
      if(localFilePath) {
        fs.unlinkSync(localFilePath);
      }
        return null
        // remove the temp file in public
    }
}

const uploadVideo = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video"
        });
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.log("Couldn't upload video for some reasons: ", error);
        if (localFilePath) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export { cloudinary, uploadImage, uploadVideo };
