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
    updateUserProfile,
    updateUserRefreshToken,
    listUsers,
    listStudentsWithProfiles,
    deleteUserById,
    getStudentsForTeacher,
    getCoursePopularityForTeacher,
    getTeacherStats,
   
} from "../repositories/user.repository.js";
import {
    findCoursesByInstructorId,
    getTeacherStudents,
     getCourseStudents
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

const getAdminStatsHandler = asyncHandler(async (req, res) => {
    const statsQuery = `
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'student') AS "totalStudents",
            (SELECT COUNT(*) FROM courses) AS "totalCourses",
            (SELECT COUNT(*) FROM enrollments WHERE status = 'pending_payment') AS "pendingEnrollments",
            (SELECT COUNT(*) FROM users WHERE role IN ('teacher', 'admin')) AS "staffMembers"
    `;

    const result = await pool.query(statsQuery);
    const row = result.rows[0];
    const stats = {
        totalStudents: parseInt(row.totalStudents, 10),
        totalCourses: parseInt(row.totalCourses, 10),
        pendingEnrollments: parseInt(row.pendingEnrollments, 10),
        staffMembers: parseInt(row.staffMembers, 10),
    };

    res.status(200).json(new ApiResponse(200, { stats }, "Admin stats retrieved"));
});

const enrollmentsByMonthSQL = `
    SELECT
        TO_CHAR(DATE_TRUNC('month', enrolled_at), 'Mon YYYY') AS month,
        TO_CHAR(DATE_TRUNC('month', enrolled_at), 'YYYY-MM') AS month_key,
        COUNT(*) AS enrollments
    FROM enrollments
    WHERE enrolled_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', enrolled_at)
    ORDER BY DATE_TRUNC('month', enrolled_at) ASC;
`;

const revenueByMonthSQL = `
    SELECT
        TO_CHAR(DATE_TRUNC('month', e.enrolled_at), 'Mon YYYY') AS month,
        TO_CHAR(DATE_TRUNC('month', e.enrolled_at), 'YYYY-MM') AS month_key,
        COALESCE(SUM(c.admission_fee), 0) AS revenue
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.status IN ('active', 'completed')
    AND e.enrolled_at >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
    GROUP BY DATE_TRUNC('month', e.enrolled_at)
    ORDER BY DATE_TRUNC('month', e.enrolled_at) ASC;
`;

const coursePopularitySQL = `
    SELECT
        c.title AS course,
        COUNT(e.id) AS students
    FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
        AND e.status IN ('active', 'completed')
    WHERE c.is_published = true
    GROUP BY c.id, c.title
    ORDER BY students DESC
    LIMIT 6;
`;

const profileCompletionSQL = `
    SELECT
        COUNT(*) FILTER (
            WHERE cell_number IS NOT NULL
            AND cnic IS NOT NULL
            AND date_of_birth IS NOT NULL
            AND father_name IS NOT NULL
            AND father_cell_number IS NOT NULL
            AND address IS NOT NULL
            AND education IS NOT NULL
            AND lead_source IS NOT NULL
        ) AS completed,
        COUNT(*) AS total
    FROM student_profiles;
`;

const getAdminChartsHandler = asyncHandler(async (req, res) => {
    const [enrollmentsRes, revenueRes, popularityRes, completionRes] =
        await Promise.all([
            pool.query(enrollmentsByMonthSQL),
            pool.query(revenueByMonthSQL),
            pool.query(coursePopularitySQL),
            pool.query(profileCompletionSQL),
        ]);

    const completionRow = completionRes.rows[0];
    const total = parseInt(completionRow.total, 10);
    const completed = parseInt(completionRow.completed, 10);

    return res.status(200).json(new ApiResponse(200, {
        charts: {
            enrollmentsByMonth: enrollmentsRes.rows.map((row) => ({
                month: row.month,
                enrollments: parseInt(row.enrollments, 10),
            })),
            revenueByMonth: revenueRes.rows.map((row) => ({
                month: row.month,
                revenue: parseFloat(row.revenue),
            })),
            coursePopularity: popularityRes.rows.map((row) => ({
                course: row.course.length > 20
                    ? row.course.substring(0, 20) + "..."
                    : row.course,
                students: parseInt(row.students, 10),
            })),
            profileCompletion: [
                { name: "Complete", value: completed },
                { name: "Incomplete", value: total - completed },
            ],
        },
    }, "Admin charts retrieved"));
});

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

        if (email !== undefined) {
            const existingUser = await findOneUserByEmailMinimal(client, email);
            if (existingUser.rowCount > 0 && existingUser.rows[0].id !== req.user.id) {
                throw new ApiError(409, "Email already exists");
            }
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

// const statsSQL = 


const getTeacherStatsHandler = asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
        const statsResult = await getTeacherStats(client, req.user.id);
        const row = statsResult.rows[0];
        

    return res.status(200).json(
        new ApiResponse(200, {
            stats: {
                totalCourses:  parseInt(row.totalCourses, 10),
                totalStudents: parseInt(row.totalStudents, 10),
            }
        }, 'Teacher stats retrieved')
    );
    } catch (error) {

        console.error(error);
        throw new ApiError(500, "Failed to get teacher stats");

    } finally {
        client.release();
    }
}); 

const getTeacherChartsHandler = asyncHandler(async (req, res) => {
  const client = await pool.connect();

    try {
        // 2. Execute parallel queries using the client
        const [studentsOverTimeRes, coursePopularityRes] = await Promise.all([
            getStudentsForTeacher(client, req.user.id),
            getCoursePopularityForTeacher(client, req.user.id),
        ]);

        // 3. Format and return the response
        return res.status(200).json(
            new ApiResponse(200, {
                charts: {
                    studentsOverTime: studentsOverTimeRes.rows.map(r => ({
                        month: r.month,
                        students: parseInt(r.students, 10),
                    })),
                    coursePopularity: coursePopularityRes.rows.map(r => ({
                        course: r.course,
                        students: parseInt(r.students, 10),
                    })),
                }
            }, 'Teacher charts retrieved')
        );
    } catch (error) {
        // 4. Pass the error up so asyncHandler and your global error middleware can process it
        throw error;
    } finally {
        // 5. Always release the client back to the pool, even if an error occurred
        if (client) {
            client.release();
        }
    }
});
const listTeacherCourses = asyncHandler(async (req, res) => {
    // Implementation for listing courses assigned to the teacher
    //take teacher id from req.user.id and then find courses from course repository where instructor_id = teacher id

    const client = await pool.connect();
    try {
        const limit = Number.parseInt(req.query.limit ?? "10", 10) || 10;
        const offset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
        const coursesResult = await findCoursesByInstructorId(client, req.user.id, limit, offset);
        res.status(200).json(new ApiResponse(200, { courses: coursesResult.rows }, "Courses fetched successfully"));
    } finally {
        client.release();
    }
}   );

const listCourseStudents = asyncHandler(async (req, res) => {
    // Implementation for listing students enrolled in a specific course
    const client = await pool.connect();
    try {
        const limit = Number.parseInt(req.query.limit ?? "10", 10) || 10;
        const offset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
        const studentsResult = await getCourseStudents(client, req.params.id, limit, offset);
        const students = studentsResult.rows.map((row) => ({
            enrollmentId: row.enrollment_id,
            id: row.student_id,
            name: row.name,
            email: row.email,
            status: row.status,
            enrolledAt: row.enrolled_at,
            course: {
                id: row.course_id,
                title: row.course_title,
                thumbnailUrl: row.course_thumbnail_url,
            },
            progress: {
                completedLectures: Number.parseInt(row.completed_lectures, 10) || 0,
                totalLectures: Number.parseInt(row.total_lectures, 10) || 0,
                percent: Number.parseInt(row.percent, 10) || 0,
            },
        }));

        res.status(200).json(new ApiResponse(200, {
            course: students[0]?.course || { id: req.params.id },
            students,
        }, "Students fetched successfully"));
    } finally {
        client.release();
    }
});

const listTeacherStudents = asyncHandler(async (req, res) => {
    const client = await pool.connect();
    try {
        const limit = Number.parseInt(req.query.limit ?? "20", 10) || 20;
        const offset = Number.parseInt(req.query.offset ?? "0", 10) || 0;
        const result = await getTeacherStudents(client, req.user.id, limit, offset);
        const students = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            coursesCount: Number.parseInt(row.courses_count, 10) || 0,
            activeEnrollments: Number.parseInt(row.active_enrollments, 10) || 0,
            completedEnrollments: Number.parseInt(row.completed_enrollments, 10) || 0,
            lastEnrolledAt: row.last_enrolled_at,
        }));

        return res.status(200).json(
            new ApiResponse(200, { students }, "Teacher students fetched successfully")
        );
    } finally {
        client.release();
    }
});

const getFullStudentProfile = asyncHandler(async (req, res) => {
  const client = await pool.connect();
  try {
    const userResult = await findOneUserById(client, req.params.id);
    if (userResult.rowCount === 0) {
      throw new ApiError(404, "Student not found");
    }

    const user = userResult.rows[0];
    if (user.role !== "student") {
      throw new ApiError(400, "User is not a student");
    }

    const profileResult = await findStudentProfileByUserId(client, user.id);
    if (profileResult.rowCount === 0) {
      throw new ApiError(404, "Student profile not found");
    }

    const profileRow = profileResult.rows[0];
    const completion = getProfileCompletion(profileRow);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          ...user,
          profile: mapStudentProfile(profileRow),
          completion,
        },
        "Student profile retrieved successfully"
      )
    );
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
    getAdminStatsHandler,
    getAdminChartsHandler,
    getUserById,
    updateUserStatus,
    deleteUser,
    listStudentsWithProfileStatus,
    getFullStudentProfile,

    //teacher controllers
    getTeacherProfile,
    updateTeacherProfile,
    listTeacherCourses,
    listCourseStudents,
    listTeacherStudents,
    getTeacherStatsHandler,
    getTeacherChartsHandler,
}