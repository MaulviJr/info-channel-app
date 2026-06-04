import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    findAllPublishedCourses,
    findCourseById,
    findCoursesByInstructorId,
    getCourseStudents,
    createCourse,
    updateCourse as updateCourseInRepo,
    deleteCourse as deleteCourseInRepo,
    findAllCourses
} from "../repositories/course.repository.js";
import { pool } from "../db/pool.js";
import {z} from "zod";
// ### Public (no auth):
// GET /api/v1/courses
// - Return only published courses (is_published = true)
// - Include instructor name from users table
// - Support pagination: ?page=1&limit=10
// - Return: { data: [...], total, page, limit }

const nullToUndefined = (value) => (value === null ? undefined : value);

const courseSchema = z.object({
    title: z.preprocess(nullToUndefined, z.string().min(1, "Title is required")),
    description: z.preprocess(
        nullToUndefined,
        z
            .string()
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

const listCourses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // fetch courses with pagination and instructor name
    const client = await pool.connect();
    try {
        const { rows: courses } = await findAllPublishedCourses(client, limit, offset);

        // return response with total count, current page, and limit
        return res.status(200).json(new ApiResponse(200, { courses }, "Courses fetched successfully"));
    } finally {
        client.release();
    }
});

const listAllCoursesForStaff = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const client = await pool.connect();
    try {
        const { rows: courses } = req.user?.role === 'teacher'
            ? await findCoursesByInstructorId(client, req.user.id, limit, offset)
            : await findAllCourses(client, limit, offset);

        return res
            .status(200)
            .json(new ApiResponse(200, { courses }, "Courses fetched successfully"));
    } finally {
        client.release();
    }
});

// GET /api/v1/courses/:id
// - Return single course with instructor name
// - If not published and requester is not admin/teacher, return 404

const getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        const { rows } = await findCourseById(client, id);
        if (rows.length === 0) {
            throw new ApiError(404, "Course not found");
        }
        const course = rows[0];

        return res.status(200).json(new ApiResponse(200, { course }, "Course fetched successfully"));
    } finally {
        client.release();
    }
});

const createACourse = asyncHandler(async (req, res) => {
    // ### Protected (teacher only):
// POST /api/v1/courses
// - Body: { title, description, admission_fee, 
//           monthly_fee, thumbnail_url }
// - instructor_id is taken from req.user.id, never from body
// - Validate: title required, price >= 0, 
//             admission_fee >= 0, monthly_fee >= 0
// - Return: 201 with created course
    
const parsed = courseSchema.safeParse(req.body);
if (!parsed.success) {
    throw new ApiError(400, "Validation failed", parsed.error.issues);
}
console.log("Creating course with data:", parsed.data, "by user:", req.user);
    const { title, description, board_registration, admission_fee, monthly_fee, thumbnail_url } = parsed.data;

    const client = await pool.connect();
    try {
        const instructorId = req.user?.id; // assuming req.user is populated by auth middleware
        if(!instructorId) {
            throw new ApiError(401, "Unable to identify instructor");
        }
        const { rows } = await createCourse(
            client,
            { title, description, board_registration, admission_fee, monthly_fee, thumbnail_url },
            instructorId
        );
        const course = rows[0];

        return res.status(201).json(new ApiResponse(201,
             { course }, 
             "Course created successfully"));
    } finally {
        client.release();
    }


});

const updateCourse = asyncHandler(async (req, res) => {
    // PUT /api/v1/courses/:id
// - Body: same as POST, all fields optional
// - Only the instructor who owns the course OR an admin can update
// - Return: updated course

    const { id } = req.params;
    const parsed = courseSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }
    const { title, description, board_registration, admission_fee, monthly_fee, thumbnail_url } = parsed.data;

    const client = await pool.connect();
    try {
        const { rows } = await findCourseById(client, id);
        if (rows.length === 0) {
            throw new ApiError(404, "Course not found");
        }
        const course = rows[0];

        // Check if requester is instructor of the course or admin
        if (course.instructor_id !== req.user.id && req.user.role !== "admin") {
            throw new ApiError(403, "Forbidden: You don't have permission to update this course");
        }

        const updatePayload = {
            title: title ?? course.title,
            description: description ?? course.description,
            board_registration: board_registration ?? course.board_registration,
            admission_fee: admission_fee ?? course.admission_fee,
            monthly_fee: monthly_fee ?? course.monthly_fee,
            thumbnail_url: thumbnail_url ?? course.thumbnail_url,
        };

        const { rows: updatedRows } = await updateCourseInRepo(client, id, updatePayload);
        const updatedCourse = updatedRows[0];

        return res.status(200)
        .json(new ApiResponse(200,
             { course: updatedCourse }, 
             "Course updated successfully"));
    } finally {
        client.release();
    }

});

const deleteCourse = asyncHandler(async (req, res) => {
  // DELETE /api/v1/courses/:id
// - Admin only
// - Return: { message: 'Course deleted' }
    const { id } = req.params;
    const client = await pool.connect();
    try {
        const { rows } = await findCourseById(client, id);

        if (rows.length === 0) {
            throw new ApiError(404, "Course not found");
        }

        const course = rows[0];
        console.log("Attempting to delete course:", course, "by user:", req.user);
        if (req.user.role !== "admin" && course.instructor_id !== req.user.id) {
            throw new ApiError(403, "Forbidden: You don't have permission to delete this course");
        }

        await deleteCourseInRepo(client, id);

        return res.status(200).json(new ApiResponse(200, null, "Course deleted successfully"));
    } finally {
        client.release();
    }

});

const toggleCoursePublish = asyncHandler(async (req, res) => {
  // PATCH /api/v1/courses/:id/publish
// - Admin only
// - Toggles is_published boolean
// - Return: { message: 'Course published/unpublished', is_published }

    const { id } = req.params;
    const client = await pool.connect();
    try {
        const { rows } = await findCourseById(client, id);
        if (rows.length === 0) {
            throw new ApiError(404, "Course not found");
        }
        const course = rows[0];
        if (req.user.role !== "admin") {
            throw new ApiError(403, "Forbidden: You don't have permission to publish/unpublish this course");
        }
        const newStatus = !course.is_published;
        await client.query(
            `UPDATE courses SET is_published = $1 WHERE id = $2`,
            [newStatus, id]
        );
        return res.status(200).json(new ApiResponse(200, { is_published: newStatus }, `Course ${newStatus ? 'published' : 'unpublished'} successfully`));
    } finally {
        client.release();
    }
});


export {

    listCourses,
    listAllCoursesForStaff,
    getCourseById,
    createACourse,
    updateCourse,
    deleteCourse,
    toggleCoursePublish
}



