import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
    
    res.status(201).json(new ApiResponse(201, {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com"
    }));


});


export {
    registerUser,
}