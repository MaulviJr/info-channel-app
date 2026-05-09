import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";


const verifyJWT = asyncHandler(async(req,_,next)=>{

//     console.log("cookies:", req.cookies);
// console.log("auth header:", req.headers.authorization);
    const token = await req.cookies?.AccessToken|| req.header("Authorization")?.replace("Bearer ", "");    
    if(!token) {
        throw new ApiError(400,"token not found");
    }

    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    req.user=user;
    next();

})

export {verifyJWT}