import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/pool.js";
import {
    findAllPublishedCourses,
    findCourseById,
    findCoursesByInstructorId,
    createCourse as createCourseInRepo,
    updateCourse as updateCourseInRepo,
    deleteCourse as deleteCourseInRepo,
    findAllCourses,
    getCourseWithModulesAndLectures
} from "../repositories/course.repository.js";

// --- Validation Schemas ---
const nullToUndefined = (value) => (value === null ? undefined : value);

const courseSchema = z.object({
    title: z.preprocess(nullToUndefined, z.string().min(1, "Title is required")),
    description: z.preprocess(
        nullToUndefined,
        z.string()
            .min(10, "Description must be at least 10 characters")
            .max(1000, "Description must be less than 1000 characters")
            .optional()
    ),
    board_registration: z.preprocess(
        nullToUndefined,
        z.enum(["SDC", "SBTE", "None"]).optional()
    ),
    admission_fee: z.preprocess(nullToUndefined, z.number().min(0)),
    monthly_fee: z.preprocess(nullToUndefined, z.number().min(0)),
    thumbnail_url: z.preprocess(nullToUndefined, z.string().url().optional())
});

class CourseService {
    async getPublishedCourses(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const client = await pool.connect();
        try {
            const { rows: courses } = await findAllPublishedCourses(client, limit, offset);
            return courses;
        } finally {
            client.release();
        }
    }

    async getStaffCourses(user, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const client = await pool.connect();
        try {
            const { rows: courses } = user?.role === 'teacher'
                ? await findCoursesByInstructorId(client, user.id, limit, offset)
                : await findAllCourses(client, limit, offset);
            return courses;
        } finally {
            client.release();
        }
    }

    async getCourseById(id) {
        const client = await pool.connect();
        try {
            const { rows } = await findCourseById(client, id);
            if (rows.length === 0) {
                throw new ApiError(404, "Course not found");
            }
            return rows[0];
        } finally {
            client.release();
        }
    }

    async createCourse(courseData, user) {
        const parsed = courseSchema.safeParse(courseData);
        if (!parsed.success) {
            throw new ApiError(400, "Validation failed", parsed.error.issues);
        }

        const instructorId = user?.id;
        if (!instructorId) {
            throw new ApiError(401, "Unable to identify instructor");
        }

        const client = await pool.connect();
        try {
            const { rows } = await createCourseInRepo(client, parsed.data, instructorId);
            return rows[0];
        } finally {
            client.release();
        }
    }

    async updateCourse(id, courseData, user) {
        const parsed = courseSchema.partial().safeParse(courseData);
        if (!parsed.success) {
            throw new ApiError(400, "Validation failed", parsed.error.issues);
        }

        const client = await pool.connect();
        try {
            const { rows } = await findCourseById(client, id);
            if (rows.length === 0) {
                throw new ApiError(404, "Course not found");
            }
            
            const course = rows[0];

            // Business Rule: Only owner or admin can update
            if (course.instructor_id !== user.id && user.role !== "admin") {
                throw new ApiError(403, "Forbidden: You don't have permission to update this course");
            }

            const updatePayload = {
                title: parsed.data.title ?? course.title,
                description: parsed.data.description ?? course.description,
                board_registration: parsed.data.board_registration ?? course.board_registration,
                admission_fee: parsed.data.admission_fee ?? course.admission_fee,
                monthly_fee: parsed.data.monthly_fee ?? course.monthly_fee,
                thumbnail_url: parsed.data.thumbnail_url ?? course.thumbnail_url,
            };

            const { rows: updatedRows } = await updateCourseInRepo(client, id, updatePayload);
            return updatedRows[0];
        } finally {
            client.release();
        }
    }

    async deleteCourse(id, user) {
        const client = await pool.connect();
        try {
            const { rows } = await findCourseById(client, id);
            if (rows.length === 0) {
                throw new ApiError(404, "Course not found");
            }

            const course = rows[0];

            // Business Rule: Only owner or admin can delete
            if (user.role !== "admin" && course.instructor_id !== user.id) {
                throw new ApiError(403, "Forbidden: You don't have permission to delete this course");
            }

            await deleteCourseInRepo(client, id);
        } finally {
            client.release();
        }
    }

    async getCourseWithModulesAndLecture(courseId) {
        const client = await pool.connect();
        try {
            console.log(`Fetching course with modules and lectures for course ID: ${courseId}`);
            const { rows } = await getCourseWithModulesAndLectures(client, courseId);
            if (rows.length === 0) {
                throw new ApiError(404, "Course not found");
            }
            return rows[0]; // This should include modules and lectures based on the repository implementation
        } finally {
            client.release();
        }
    }

    async toggleCoursePublish(id, user) {
        const client = await pool.connect();
        try {
            // Business Rule: Admin only
            if (user.role !== "admin") {
                throw new ApiError(403, "Forbidden: You don't have permission to publish/unpublish this course");
            }

            const { rows } = await findCourseById(client, id);
            if (rows.length === 0) {
                throw new ApiError(404, "Course not found");
            }
            
            const course = rows[0];
            const newStatus = !course.is_published;
            
            // Ideally this query should be in course.repository.js, but kept here to match your original logic
            await client.query(
                `UPDATE courses SET is_published = $1 WHERE id = $2`,
                [newStatus, id]
            );
            
            return newStatus;
        } finally {
            client.release();
        }
    }
}

export const courseService = new CourseService();