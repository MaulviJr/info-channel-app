import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/pool.js";
import { uploadImage } from "../utils/cloudinary.js";
import { generateAccessToken, generateRefreshToken } from "../utils/tokens.js";
import { getProfileCompletion } from "../services/studentProfile.service.js";
import {
    createStudentProfile,
    createUser,
    findOneStudentProfileByCnic,
    findOneStudentProfileByGrNumber,
    findStudentProfileByUserId,
    findOneUserByEmail,
    findOneUserById,
    findOneUserByEmailMinimal,
    updateStudentProfile,
    updateUserRefreshToken,
    listUsers,
    listStudentsWithProfiles,
    deleteUserById
} from "../repositories/user.repository.js";
import {
    findCoursesByInstructorId
} from "../repositories/course.repository.js";
import jwt from "jsonwebtoken";
const emptyToUndefined = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
};

const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const updateTeacherProfileSchema = z.object({
    name: z.string().trim().min(1, "Name is required").optional(),
    email: z.string().trim().email("Invalid email").optional(),
    // password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

const adminCreateSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const studentProfileSchema = z.object({
    profilePictureUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
    cellNumber: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Cell number is required").max(20)
    ),
    whatsappNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    dateOfBirth: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Date of birth is required")
    ),
    education: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Education is required").max(100)
    ),
    cnic: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "CNIC is required").max(20)
    ),
    religion: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
    fatherName: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Father name is required").max(255)
    ),
    fatherCellNumber: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Father cell number is required").max(20)
    ),
    fatherWhatsappNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    fatherCnic: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    fatherOccupation: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    address: z.preprocess(
        emptyToUndefined,
        z.string().min(1, "Address is required")
    ),
    leadSource: z.preprocess(
        emptyToUndefined,
        z.enum(["Sign Board", "Social Media", "Friends", "Teacher", "Other"], {
            required_error: "Lead source is required",
        })
    ),
});

const generateGrNumber = () => {
    const year = new Date().getFullYear();
    const random = crypto.randomInt(100000, 1000000);
    return `GR-${year}-${random}`;
};

const mapStudentProfile = (profile) => ({
    profilePictureUrl: profile.profile_picture_url,
    cellNumber: profile.cell_number,
    whatsappNumber: profile.whatsapp_number,
    dateOfBirth: profile.date_of_birth,
    education: profile.education,
    cnic: profile.cnic,
    religion: profile.religion,
    fatherName: profile.father_name,
    fatherCellNumber: profile.father_cell_number,
    fatherWhatsappNumber: profile.father_whatsapp_number,
    fatherCnic: profile.father_cnic,
    fatherOccupation: profile.father_occupation,
    address: profile.address,
    leadSource: profile.lead_source,
    grNumber: profile.gr_number,
});



const registerUser = asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const { name, email, password } = parsed.data;

    const role = "student";
    let uploadedProfileUrl = null;

    if (req.file?.path) {
        const uploadResult = await uploadImage(req.file.path);
        uploadedProfileUrl = uploadResult?.secure_url || uploadedProfileUrl;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingUser = await findOneUserByEmailMinimal(client, email);
        if (existingUser.rowCount > 0) {
            throw new ApiError(409, "Email already exists");
        }

        let grNumber = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const candidate = generateGrNumber();
            const existingGr = await findOneStudentProfileByGrNumber(
                client,
                candidate
            );
            if (existingGr.rowCount === 0) {
                grNumber = candidate;
                break;
            }
        }

        if (!grNumber) {
            throw new ApiError(500, "Failed to generate GR number");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userInsert = await createUser(
            client,
            name,
            email,
            passwordHash,
            role
        );

        const user = userInsert.rows[0];

        const profileInsert = await createStudentProfile(
            client,
            user.id,
            uploadedProfileUrl || null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            grNumber
        );

        await client.query("COMMIT");

        res.status(201).json(
            new ApiResponse(201, {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: {
                    profilePictureUrl: profileInsert.rows[0].profile_picture_url,
                    cellNumber: profileInsert.rows[0].cell_number,
                    whatsappNumber: profileInsert.rows[0].whatsapp_number,
                    dateOfBirth: profileInsert.rows[0].date_of_birth,
                    education: profileInsert.rows[0].education,
                    cnic: profileInsert.rows[0].cnic,
                    religion: profileInsert.rows[0].religion,
                    fatherName: profileInsert.rows[0].father_name,
                    fatherCellNumber: profileInsert.rows[0].father_cell_number,
                    fatherWhatsappNumber: profileInsert.rows[0].father_whatsapp_number,
                    fatherCnic: profileInsert.rows[0].father_cnic,
                    fatherOccupation: profileInsert.rows[0].father_occupation,
                    address: profileInsert.rows[0].address,
                    leadSource: profileInsert.rows[0].lead_source,
                    grNumber: profileInsert.rows[0].gr_number,
                },
            })
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

const createUserWithRole = async (req, res, role) => {
    const parsed = adminCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const { name, email, password } = parsed.data;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingUser = await findOneUserByEmailMinimal(client, email);
        if (existingUser.rowCount > 0) {
            throw new ApiError(409, "Email already exists");
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userInsert = await createUser(
            client,
            name,
            email,
            passwordHash,
            role
        );

        await client.query("COMMIT");

        const user = userInsert.rows[0];
        res.status(201).json(
            new ApiResponse(
                201,
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                `User created with role ${role}`
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

const createTeacher = asyncHandler(async (req, res) => {
    await createUserWithRole(req, res, "teacher");
});

const createAdmin = asyncHandler(async (req, res) => {
    await createUserWithRole(req, res, "admin");
});

const updateStudentProfileHandler = asyncHandler(async (req, res) => {
    const parsed = studentProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const {
        profilePictureUrl,
        cellNumber,
        whatsappNumber,
        dateOfBirth,
        education,
        cnic,
        religion,
        fatherName,
        fatherCellNumber,
        fatherWhatsappNumber,
        fatherCnic,
        fatherOccupation,
        address,
        leadSource,
    } = parsed.data;

    let uploadedProfileUrl = profilePictureUrl || null;

    if (req.file?.path) {
        const uploadResult = await uploadImage(req.file.path);
        uploadedProfileUrl = uploadResult?.secure_url || uploadedProfileUrl;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const profileResult = await findStudentProfileByUserId(
            client,
            req.user.id
        );
        if (profileResult.rowCount === 0) {
            throw new ApiError(404, "Student profile not found");
        }

        const cnicResult = await findOneStudentProfileByCnic(client, cnic);
        if (
            cnicResult.rowCount > 0 &&
            cnicResult.rows[0].user_id !== req.user.id
        ) {
            throw new ApiError(409, "CNIC already exists");
        }

        const updatedProfile = await updateStudentProfile(
            client,
            req.user.id,
            uploadedProfileUrl,
            cellNumber,
            whatsappNumber || null,
            dateOfBirth,
            education,
            cnic,
            religion || null,
            fatherName,
            fatherCellNumber,
            fatherWhatsappNumber || null,
            fatherCnic || null,
            fatherOccupation || null,
            address,
            leadSource
        );

        await client.query("COMMIT");

        const profile = updatedProfile.rows[0];
        const completion = getProfileCompletion(profile);

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    profile: mapStudentProfile(profile),
                    completion,
                },
                "Profile updated"
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

const loginSchema = z.object({
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

const loginUser = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    console.log("Login request body:", req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const { email, password } = parsed.data;

    const client = await pool.connect();
    try {
        const userResult = await findOneUserByEmail(client, email);

        if (userResult.rowCount === 0) {
            throw new ApiError(401, "Invalid email or password");
        }

        const user = userResult.rows[0];

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            throw new ApiError(401, "Invalid email or password");
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await updateUserRefreshToken(
            client,
            user.id,
            refreshToken,
            refreshTokenExpiresAt
        );
        const options = {
            httpOnly: true,
            secure: true,
        };

        res.status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                accessToken,
                refreshToken,
            }, "Login successful")
        );
    } finally {
        client.release();
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
        let profile = null;
        let completion = null;

        if (req.user.role === "student") {
            const profileResult = await findStudentProfileByUserId(
                client,
                req.user.id
            );
            if (profileResult.rowCount > 0) {
                const profileRow = profileResult.rows[0];
                profile = mapStudentProfile(profileRow);
                completion = getProfileCompletion(profileRow);
            }
        }

        res.status(200).json(
            new ApiResponse(200, {
                user: {
                    id: req.user.id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role,
                },
                profile,
                completion,
            })
        );
    } finally {
        client.release();
    }
});

const getProfileStatus = asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
        const profileResult = await findStudentProfileByUserId(
            client,
            req.user.id
        );
        if (profileResult.rowCount === 0) {
            throw new ApiError(404, "Student profile not found");
        }

        const profile = profileResult.rows[0];
        const completion = getProfileCompletion(profile);

        res.status(200).json(
            new ApiResponse(200, {
                completion,
            })
        );
    } finally {
        client.release();
    }
});

const logoutUser = asyncHandler(async (req, res) => {
    const client = await pool.connect();
   //invalidate token in db 
    const user=req.user;

    try {
        await updateUserRefreshToken(client, user.id, null, null);
    }
    catch (error) {    
        
        console.error("Error during logout:", error);
    }     finally {
        client.release();
    }
    res.status(200)
    .clearCookie("AccessToken")
    .clearCookie("RefreshToken")
    .json(new ApiResponse(200, null, "Logged out successfully"));

});

const refreshTokenHandler = asyncHandler(async (req, res) => {
    const token =
        req.cookies?.RefreshToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    console.log("Refresh token received:", token);

    // Validate token
    // If valid, generate new access token and refresh token, update in DB, and return new tokens

    if (!token) {
        throw new ApiError(401, "Refresh token required");
    }

    const decodedtoken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    console.log("Decoded refresh token:", decodedtoken);
    const userId = decodedtoken?.id;
    console.log("Decoded refresh token for user ID:", userId);
    const client = await pool.connect();
    try {
        const user = await findOneUserById(client, userId);

        if (user.rowCount === 0) {
            throw new ApiError(401, "Invalid refresh token, so can't find user");
        }

        const userRow = user.rows[0];
        const accessToken = generateAccessToken(userRow);
        const refreshToken = generateRefreshToken(userRow);
        const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await updateUserRefreshToken(
            client,
            userRow.id,
            refreshToken,
            refreshTokenExpiresAt
        );

        const options = {
            httpOnly: true,
            secure: true,
        };

        res.status(200)
        .cookie("AccessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                accessToken,
                refreshToken,
            }, "Tokens refreshed")
        );
    } finally {
        client.release();
    }
});

// GET    /api/v1/users/admin/users              → list all users (filterable by role)
// GET    /api/v1/users/admin/users/:id          → get single user with full profile
// PATCH  /api/v1/users/admin/users/:id/status   → activate or deactivate a user
// DELETE /api/v1/users/admin/users/:id          → delete user
// GET    /api/v1/users/admin/students           → list students with profile completion status

// admin controllers to be implemnented below

const listAllUsers = asyncHandler(async (req, res) => {
    // Implementation for listing all users with optional role filter
    const client = await pool.connect();
    try {
        const roleFilter = req.query.role;
        let usersResult;
        if (roleFilter) {
            usersResult = await listUsersByRole(client, roleFilter);
        } else {
            usersResult = await listUsers(client, 100, 0); // default limit and offset
        }
        res.status(200).json(new ApiResponse(200, usersResult.rows, "Users listed successfully"));
    } finally {
        client.release();
    }
});

const getUserById = asyncHandler(async (req, res) => {
    // Implementation for getting a single user by ID with full profile
    const client = await pool.connect();
    try {
        const user = await findOneUserById(client, req.params.id);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        res.status(200).json(new ApiResponse(200, user.rows[0], "User retrieved successfully"));
    } finally {
        client.release();
    }
});

const updateUserStatus = asyncHandler(async (req, res) => {
    // how will i imnplement it since i don't have any columns of active in db ? 

});

const deleteUser = asyncHandler(async (req, res) => {
    // Implementation for deleting a user

    const userId = req.params.id;
    const client = await pool.connect();

    try {
        await deleteUserById(client, userId);
        res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
    } finally {
        client.release();
    }

});

const listStudentsWithProfileStatus = asyncHandler(async (req, res) => {

    const client = await pool.connect();

    try {

        const usersResult =
            await listStudentsWithProfiles(client, 10, 0);

        const students = usersResult.rows.map(user => {

            const profileStatus = getProfileCompletion(user);

            return {
                id: user.id,
                name: user.name,
                email: user.email,

                profileStatus
            };
        });

        res.status(200).json(
            new ApiResponse(
                200,
                students,
                "Students fetched successfully"
            )
        );

    } catch (error) {

        console.error(error);

        throw new ApiError(
            500,
            "Failed to list students with profile status"
        );

    } finally {

        client.release();

    }
});

const changeUserRole = asyncHandler(async (req, res) => {
    // Implementation for changing a user's role (admin only)
    // Validate new role, update in DB, return updated user info

    

});

// GET  /api/v1/users/teacher/my-courses        → list courses assigned to this teacher
// GET  /api/v1/users/teacher/my-courses/:id/students  → students enrolled in a specific course

// GET  /api/v1/users/teacher/profile           → get teacher's own profile
// PUT  /api/v1/users/teacher/profile           → update teacher's own profile

const getTeacherProfile = asyncHandler(async (req, res) => {
    // Implementation for getting teacher's own profile
    const client = await pool.connect();
    try {
        const user = await findOneUserById(client, req.user.id);
        if (!user) {
            throw new ApiError(404, "Teacher not found");
        }
        res.status(200).json(new ApiResponse(200, {
            id: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email,
            role: user.rows[0].role,
            created_at: user.rows[0].created_at
        }, "Teacher profile retrieved successfully"));
    } finally {
        client.release();
    }
});

const updateTeacherProfile = asyncHandler(async (req, res) => {
    // Implementation for updating teacher's own profile
    const client = await pool.connect();
    try {
        const parsed = updateTeacherProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new ApiError(400, "Validation failed", parsed.error.issues);
        }
        const { name, email } = parsed.data;

        const existingUser = await findOneUserByEmailMinimal(client, email);
        if (existingUser.rowCount > 0 && existingUser.rows[0].id !== req.user.id) {
            throw new ApiError(409, "Email already exists");
        }
        const updatedUser = await updateUserProfile(client, req.user.id, name, email);

        res.status(200).json(new ApiResponse(200, {
            id: updatedUser.rows[0].id,
            name: updatedUser.rows[0].name,
            email: updatedUser.rows[0].email,
            role: updatedUser.rows[0].role,
            created_at: updatedUser.rows[0].created_at
        }, "Teacher profile updated successfully"));
    } finally {
        client.release();
    }
});

const listTeacherCourses = asyncHandler(async (req, res) => {
    // Implementation for listing courses assigned to the teacher
    //take teacher id from req.user.id and then find courses from course repository where instructor_id = teacher id

    const cient = await pool.connect();
    try {
        const coursesResult = await findCoursesByInstructorId(cient, req.user.id, 10, 0);
        res.status(200).json(new ApiResponse(200, coursesResult.rows, "Courses fetched successfully"));
    } finally {
        cient.release();
    }
}   );

const listCourseStudents = asyncHandler(async (req, res) => {
    // Implementation for listing students enrolled in a specific course
    const client = await pool.connect();
    try {
        const studentsResult = await getCourseStudents(client, req.params.id, 10, 0);
        res.status(200).json(new ApiResponse(200,
             studentsResult.rows, 
             "Students fetched successfully"));
    } finally {
        client.release();
    }
});

export {
    registerUser,
    loginUser,
    updateStudentProfileHandler,
    getCurrentUser,
    getProfileStatus,
    logoutUser,
    refreshTokenHandler,

    //admin controllers
    createTeacher,
    createAdmin,
    listAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    listStudentsWithProfileStatus,

    //teacher controllers
    getTeacherProfile,
    updateTeacherProfile,
    listTeacherCourses,
    listCourseStudents,
}