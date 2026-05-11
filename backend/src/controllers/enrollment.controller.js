import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { pool } from "../db/pool.js";
import { enrollStudentInCourse } from "../services/enrollment.service.js";

const enrollmentSchema = z.object({
    courseId: z.string().uuid("Invalid course id"),
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

export { createEnrollmentHandler };
