import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
    });

 const uploadResult = async (localfilepath)=>{
 try{
    if(!localfilepath){
        return null;
    }
   const res = await cloudinary.uploader.upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       console.log("file is uploaded",res.url);
       return res;
    }
    catch(error){
        fs.unlinkSync(localfilepath); // remove the locally saved file
        return null;
    }
 }

 export {uploadResult};