import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import { uploadResult } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
import { upload } from "../middlewares/multer.middleware.js";
const generateAccessAndRefreshTokens = async(userId)=>{
      try{
        const user = await User.findById(userId);
       const accesstoken = await user.generateAccessToken();
       const refreshtoken=await user.generateRefreshToken();
       user.refreshtoken = refreshtoken;
       await user.save({validateBeforeSave:false});
       return {accesstoken,refreshtoken};
      }
      catch(error){
        throw new  ApiError(500,"something went wrong while generating refresh and ")
      }
}
const registeruser = asynchandler(async (req, res) => {
  // get user details from frontend
  //validation -- not empty
  // check if already alrerady exists : 
// check for avatar, images -- upload them
// upload them to cloudinary, avatar
// create user object -- create entry in db
// remove password and refresh token field from response
// check for user creation 
// return response

const {fullname,email,username,password}  = req.body;
if(
  [fullname,email,username,password].some((field)=>field?.trim()==="")
){
  throw new ApiError(400, "All fields are required");
}
const existedUser = await User.findOne({
  $or : [{username},{email}]
});
if(existedUser){
  throw new (409,"User with username or email already exists");
}

  const avatarLocalPath =  await req.files?.avatar[0]?.path;
  const CoverImageLocalPath = await req.files?.coverimage[0]?.path;
  if(!avatarLocalPath){
    throw new ApiError(401,"Avatar file is required");
  }
  const avatar = await uploadResult(avatarLocalPath);
  const coverimage =  await uploadResult(CoverImageLocalPath);

 if(!avatar){
  throw new ApiError(400, `avatar file is requireD`);
 }
 const user = await User.create({
  fullname,
  avatar: avatar.url,
  coverimage: coverimage.url,
  email,
  password,
  username: username.toLowerCase()
 })
 const createdUser = await User.findById(user._id).select(
  "-password -refreshtoken"
 )
 if(!createdUser){
  throw new ApiError(500 , "Something went wrong while registering user");
 }
 return res.status(201).json(
  new ApiResponse(200,createdUser,"User Registered successfully")
 )
});
const loginuser = asynchandler(async(req,res)=>{
  //req body -> data
  // username or email
  // check if this is not empty
  //find the user 
  //user doesn't exist
  // check for password
  // authentication failed
  // else access and refresh token
  // send as cookies
  // send success response

  const {email,username,password} = req.body;
  if(!(username || email)){
    throw new ApiError(400,"username or email is required");
  }
  const user = await User.findOne({
   $or: [{username} || {email}]
  })
  if(!user){
    throw new ApiError(404,"user doesn't exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
  }
  const {accesstoken,refreshtoken} = await generateAccessAndRefreshTokens(user._id);
 const loggedInUser = await User.findById(user._id).select(
  "-password -refreshtoken"
 )

 const options = {
  httpOnly: true,
  secure: true,
 }
  return res
  .status(200)
  .cookie("accesstoken",accesstoken,options)
  .cookie("refreshtoken",refreshtoken,options)
  .json(
    new ApiResponse(200,{
      user: loggedInUser, accesstoken,refreshtoken
    },
    "user logged in successfully"
    )
  )
});
  const logoutUser = asynchandler(async(req,res)=>{
  await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refrestoken:undefined
        }
      },
      {
        new  : true
      }
    )
    const options = {
      httpOnly:true,
      secure:true
    }
    return res
    .status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new ApiResponse(200,{},"user logged out"))
});
const refreshaccesstoken = asynchandler(async(req,res)=>{
const incomingrefreshtoken =  res.cookies.refreshtoken || req.body.refreshtoken;
if(!incomingrefreshtoken){
  throw new ApiError(401,"unauthorized request");
}

try {
  const decodedtoken = jwt.verify(
    incomingrefreshtoken,
    process.env.REFRESH_TOKEN_SECRET
  )
  
  const user = await User.findById(decodedtoken?._id);
  if(!user){
    throw new ApiError(403,"invalid refresh token");
  }
  if(incomingrefreshtoken!==user?.refreshtoken){
    throw new ApiError(401,"refresh tokeen is expired");
  }
  const options = {
    httpOnly:true,
    secure:true
  }
  const {accesstoken,newrefreshtoken}=await generateAccessAndRefreshTokens(user._id);
  return res
  .status(200)
  .cookie("accesstoken",accesstoken)
  .cookie("refreshtoken",newrefreshtoken)
  .json(
    new ApiResponse(200,
      {accesstoken,refreshtoken:newrefreshtoken},
      "access token refresh successfully"
  
    )
  )
} catch (error) {
  throw new ApiError(401,"INVALID REFRESH TOKEN");
}

});
const changecurrentpassword = asynchandler(async(req,res)=>{
  const {oldpassword,newpassword,confirmpassword} = req.body;
  const user = await User.findById(req.user?._id);
  const ispasswordright = await user.isPasswordCorrect(oldpassword);
  if(!ispasswordright){
    throw new ApiError(400,"invalid old password");
  }
  if(confirmpassword!=newpassword){
    throw new ApiError(401,"new password is not equal");
  }
  user.password = newpassword;
  await user.save({validateBeforeSave:false});
  return res
  .status(200)
  .json(new ApiResponse(200,{},"password changed successfully"));
});
const getcurrentuser = asynchandler(async(req,res)=>{
  return res
  .status(200)
  .json(200,req.user,"current user fetched successfully");
});
const updateuseravatar = asynchandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is required");
  }
  const avatar = await uploadResult(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(400,"error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },{
      new:true
    }
  ).select("-password");
  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"avatar updated successfully")
  )
})
const updateusercoverimage = asynchandler(async(req,res)=>{
  const CoverImageLocalPath = req.file?.path;
  if(!CoverImageLocalPath){
    throw new ApiError(400,"avatar file is required");
  }
  const coverimage = await uploadResult(CoverImageLocalPath);
  if(!coverimage.url){
    throw new ApiError(400,"error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverimage: coverimage.url
      }
    },{
      new:true
    }
  ).select("-password");
  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"avatar updated successfully")
  )
})
export { 
  registeruser,
  loginuser,
  logoutUser,
  refreshaccesstoken,
  changecurrentpassword,
  getcurrentuser,
  updateuseravatar,
  updateusercoverimage
};
