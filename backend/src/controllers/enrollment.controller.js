import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { pool } from "../db/pool.js";
import {
    enrollStudentInCourse,
    updateEnrollmentStatus,
} from "../services/enrollment.service.js";

const enrollmentSchema = z.object({
    courseId: z.string().uuid("Invalid course id"),
});

const enrollmentStatusSchema = z.object({
    status: z.enum(["active", "completed", "cancelled"]),
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

        res.status(201).json(
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

const updateEnrollmentStatusHandler = asyncHandler(async (req, res) => {
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

        res.status(200).json(
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

export { createEnrollmentHandler, updateEnrollmentStatusHandler };
