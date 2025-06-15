import asynchandler from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import { uploadResult } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
const generateAccessAndRefreshTokens = async(userId)=>{
      try{
        const user = await User.findById(userId);
       const accessToken =  user.generateAccessToken();
       const refreshToken= user.generateRefreshToken();
       user.refreshToken = refreshToken;
       await user.save({validateBeforeSave:false});
       return {accessToken,refreshToken};
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
  if(!username || !email){
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
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
 const loggedInUser = await User.findById(user._id).select(
  "-password -refreshToken"
 )

 const options = {
  httpOnly: true,
  secure: true,
 }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,{
      user: loggedInUser, accessToken,refreshToken
    },
    "user logged in successfully"
    )
  )

  const logoutUser = asynchandler(async(req,res)=>{
    User.findById()
  })

})
export { 
  registeruser,
  loginuser
};