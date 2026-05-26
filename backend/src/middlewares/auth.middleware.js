import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { findOneUserByEmail } from "../repositories/user.repository.js";
import { pool } from "../db/pool.js";


const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.AccessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const client = await pool.connect();
        try {
            const userResult = await findOneUserByEmail(client, decodedToken?.email);
            if (userResult.rowCount === 0) {
                throw new ApiError(401, "Unauthorized");
            }

            const user = userResult.rows[0];
            req.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            };
            next();
        } finally {
            client.release();
        }
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token expired");
        }
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token");
        }

        throw error;
    }
});

const requireRole = (...roles) => (req, _, next) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }
    // console.log("Checking roles:", req.user.role, "against required roles:", roles);
    if (!roles.includes(req.user.role)) {
        throw new ApiError(403, "Forbidden");
    }

    next();
};

export { verifyJWT, requireRole };