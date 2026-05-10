import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { findOneUserByEmail } from "../repositories/user.repository.js";


const verifyJWT = asyncHandler(async(req,_,next)=>{

//     console.log("cookies:", req.cookies);
// console.log("auth header:", req.headers.authorization);
   try {
    const token = await req.cookies?.AccessToken|| req.header("Authorization")?.replace("Bearer ", "");    
    if(!token) {
        throw new ApiError(400,"token not found");
    }
    const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
    const client = await pool.connect();
    await client.query("BEGIN");
    const user = await findOneUserByEmail(client, decodedToken?.email).select("-password_hash -refresh_token");

    if(!user){
        await client.query("ROLLBACK");
        throw new ApiError(401,"Unauthorized");
    }

    req.user=user;
    next();
   } catch (error) {
    if(error.name === "TokenExpiredError"){
        throw new ApiError(401,"Token expired");
    } else if (error.name === "JsonWebTokenError"){
        throw new ApiError(401,"Invalid token");
    } else {
        throw error;
    }
}});

export {verifyJWT}