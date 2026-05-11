import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import findAllPublishedCourses from "../repositories/course.repository.js";
import { pool } from "../db/pool.js";
// ### Public (no auth):
// GET /api/v1/courses
// - Return only published courses (is_published = true)
// - Include instructor name from users table
// - Support pagination: ?page=1&limit=10
// - Return: { data: [...], total, page, limit }

const listCourses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // fetch courses with pagination and instructor name
    const { rows: courses } = await findAllPublishedCourses(pool, limit, offset);

    // return response with total count, current page, and limit
    res.status(200).json(new ApiResponse(200, { courses }, "Courses fetched successfully"));
});

// GET /api/v1/courses/:id
// - Return single course with instructor name
// - If not published and requester is not admin/teacher, return 404

// ### Protected (admin or teacher only):
// POST /api/v1/courses
// - Body: { title, description, price, admission_fee, 
//           monthly_fee, thumbnail_url }
// - instructor_id is taken from req.user.id, never from body
// - Validate: title required, price >= 0, 
//             admission_fee >= 0, monthly_fee >= 0
// - Return: 201 with created course

// PUT /api/v1/courses/:id
// - Body: same as POST, all fields optional
// - Only the instructor who owns the course OR an admin can update
// - Return: updated course

// DELETE /api/v1/courses/:id
// - Admin only
// - Return: { message: 'Course deleted' }

// PATCH /api/v1/courses/:id/publish
// - Admin only
// - Toggles is_published boolean
// - Return: { message: 'Course published/unpublished', is_published }
