import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { pool } from "../db/pool.js";
import {
    enrollStudentInCourse,
    updateEnrollmentStatus,
   
} from "../services/enrollment.service.js";
import { deleteEnrollmentById, getEnrollmentById } from "../repositories/enrollment.repository.js";
const enrollmentSchema = z.object({
    courseId: z.string().uuid("Invalid course id"),
});

const enrollmentStatusSchema = z.object({
    status: z.enum(["active", "completed", "cancelled", "pending_payment"]),
});

const paymentStatusSchema = z.object({
    status: z.enum(["pending_payment", "active"]),
});

const enrollmentIdSchema = z.object({
    id: z.string().uuid("Invalid enrollment id"),
});

const createEnrollmentHandler = asyncHandler(async (req, res) => {
    const parsed = enrollmentSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const { courseId } = parsed.data;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const enrollment = await enrollStudentInCourse(
            client,
            req.user.id,
            courseId
        );

        await client.query("COMMIT");

      return  res.status(201).json(
            new ApiResponse(
                201,
                {
                    enrollment,
                },
                "Enrollment created"
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

const changeEnrollmentStatusHandler = asyncHandler(async (req, res) => {
    const paramsParsed = enrollmentIdSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        throw new ApiError(400, "Validation failed", paramsParsed.error.issues);
    }

    const bodyParsed = enrollmentStatusSchema.safeParse(req.body);
    if (!bodyParsed.success) {
        throw new ApiError(400, "Validation failed", bodyParsed.error.issues);
    }

    const { id } = paramsParsed.data;
    const { status } = bodyParsed.data;

    const client = await pool.connect();
    try {
        const enrollment = await updateEnrollmentStatus(client, id, status);

       return  res.status(200).json(
            new ApiResponse(
                200,
                { enrollment },
                "Enrollment status updated"
            )
        );
    } finally {
        client.release();
    }
});

// const changePaymentStatusHandler = asyncHandler(async (req, res) => {
//     const paramsParsed = enrollmentIdSchema.safeParse(req.params);
//     if (!paramsParsed.success) {
//         throw new ApiError(400, "Validation failed", paramsParsed.error.issues);
//     }

//     const bodyParsed = paymentStatusSchema.safeParse(req.body);
//     if (!bodyParsed.success) {
//         throw new ApiError(400, "Validation failed", bodyParsed.error.issues);
//     }

//     const { id } = paramsParsed.data;
//     const { status } = bodyParsed.data;

//     const client = await pool.connect();
//     try {
//         const enrollment = await updateEnrollmentStatus(client, id, status);

//         return res.status(200).json(
//             new ApiResponse(
//                 200,
//                 { enrollment },
//                 "Payment status updated"
//             )
//         );
//     } finally {
//         client.release();
//     }
// });

const getEnrollmentHandler = asyncHandler(async (req, res) => {
    // console.log("I am here in getEnrollmentHandler for user:", req.user);
    const paramsParsed = enrollmentIdSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        throw new ApiError(400, "Validation failed", paramsParsed.error.issues);
    }
    const { id } = paramsParsed.data;

    // Use json_build_object to create the nested JSON structure directly in SQL
    const query = `
        SELECT 
            e.id,
            e.student_id,
            e.course_id,
            e.status,
            e.enrolled_at,
            c.instructor_id, -- We select this purely for the JS auth check below
            json_build_object(
                'title', c.title,
                'description', c.description,
                'thumbnail_url', c.thumbnail_url,
                'instructor', json_build_object(
                    'name', i.name
                )
            ) AS course
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users i ON c.instructor_id = i.id
        WHERE e.id = $1
    `;

    const enrollmentResult = await pool.query(query, [id]);

    if (enrollmentResult.rowCount === 0) {
        throw new ApiError(404, "Enrollment not found");
    }

    const enrollment = enrollmentResult.rows[0];

    // Authorization checks
    const isStudent = enrollment.student_id === req.user.id;
    const isInstructor = enrollment.instructor_id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isStudent && !isInstructor && !isAdmin) {
        throw new ApiError(403, "Access denied. You do not have permission to view this enrollment.");
    }

    // Clean up the object before sending to match your exact desired output
    delete enrollment.instructor_id;

    return res.status(200).json(
        new ApiResponse(200, { enrollment }, "Enrollment retrieved successfully")
    );
});

const getMyEnrollmentsHandler = asyncHandler(async (req, res) => {
    // console.log("I am here in getMyEnrollmentsHandler for user:", req.user);
    const query = `
        SELECT 
            e.id,
            e.course_id,
            e.status,
            e.enrolled_at,
            json_build_object(
                'title', c.title,
                'description', c.description,
                'thumbnail_url', c.thumbnail_url,
                'admission_fee', c.admission_fee,
                'monthly_fee', c.monthly_fee,
                'instructor', json_build_object('name', u.name)
            ) AS course,
            json_build_object(
                'completedLectures', 0,
                'totalLectures', 0,
                'percent', 0
            ) AS progress
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON c.instructor_id = u.id
        WHERE e.student_id = $1
        ORDER BY e.enrolled_at DESC
    `;
// 
    const result = await pool.query(query, [req.user.id]);
    // console.log("Enrollments fetched for user:", req.user.id, "Enrollments:", result.rows);
    return res.status(200).json(
        new ApiResponse(
            200,
            { enrollments: result.rows },
            "Enrollments retrieved successfully"
        )
    );
});

const deleteEnrollmentHandler = asyncHandler(async (req, res) => {
    const paramsParsed = enrollmentIdSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        throw new ApiError(400, "Validation failed", paramsParsed.error.issues);
    }

    const { id } = paramsParsed.data;

    const client = await pool.connect();
    try {
        const existing = await getEnrollmentById(client, id);
        if (existing.rowCount === 0) {
            throw new ApiError(404, "Enrollment not found");
        }

        await deleteEnrollmentById(client, id);

        return res.status(200).json(
            new ApiResponse(200, null, "Enrollment deleted successfully")
        );
    } finally {
        client.release();
    }
// 
}); 
export {
    createEnrollmentHandler,
    changeEnrollmentStatusHandler,
    // changePaymentStatusHandler,
    deleteEnrollmentHandler,
    getEnrollmentHandler,
    getMyEnrollmentsHandler
};
