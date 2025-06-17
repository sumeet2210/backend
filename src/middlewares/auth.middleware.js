import { ApiError } from "../utils/ApiError.js";
import asynchandler from "../utils/asynchandler.js"
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT  = asynchandler(async(req,res,next)=>{


   try {
    const token = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer ","");
    if(!token){
     throw new ApiError(401,"unauthorized request");
    }
    const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id).select(
         "-password -refreshtoken"
     )
     if(!user){
         // TODO : discuss about frontend
         throw new ApiError(401,"Invalid Access Token");
     }
     req.user = user;
     next();
   } catch (error) {
    throw new ApiError(402,error?.message || "Invalid access token");
   }
})