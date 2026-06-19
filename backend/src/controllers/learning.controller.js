import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { pool } from "../db/pool.js";
import { upsertProgress } from "../repositories/progress.repository.js";
import {getCourseForLearning} from "../repositories/learning.repository.js";
import { verifyEnrollment } from "../repositories/enrollment.repository.js";


// --- VALIDATION SCHEMAS ---
const progressSchema = z.object({
  courseId: z.string().uuid(),
  lectureId: z.string().uuid(),
  isCompleted: z.boolean(),
});

export const getLearningCourseHandler = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    const isEnrolled = await verifyEnrollment(client, userId, courseId);
    if (!isEnrolled) {
      throw new ApiError(403, "You do not have an active enrollment for this course.");
    }

    const result = await getCourseForLearning(client, courseId, userId);
    if (result.rowCount === 0) {
      throw new ApiError(404, "Course not found.");
    }

    return res.status(200).json(
      new ApiResponse(200, { course: result.rows[0] }, "Learning course fetched successfully")
    );
  } finally {
    client.release();
  }
});

export const updateProgressHandler = asyncHandler(async (req, res) => {
    console.log("Received progress update request with body:", req.body);
  const parsed = progressSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.issues);
  }

  const { courseId, lectureId, isCompleted } = parsed.data;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    const isEnrolled = await verifyEnrollment(client, userId, courseId);
    if (!isEnrolled) {
      throw new ApiError(403, "You do not have an active enrollment for this course.");
    }

    const result = await upsertProgress(client, userId, courseId, lectureId, isCompleted);

    return res.status(200).json(
      new ApiResponse(200, { progress: result.rows[0] }, "Progress updated successfully")
    );
  } finally {
    client.release();
  }
});