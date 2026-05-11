import { ApiError } from "../utils/ApiError.js";
import { findStudentProfileByUserId } from "../repositories/user.repository.js";
import {
    createEnrollment,
    findEnrollmentByStudentCourse,
} from "../repositories/enrollment.repository.js";
import { getProfileCompletion } from "./studentProfile.service.js";

const enrollStudentInCourse = async (client, studentId, courseId) => {
    const profileResult = await findStudentProfileByUserId(client, studentId);
    if (profileResult.rowCount === 0) {
        throw new ApiError(404, "Student profile not found");
    }

    const courseResult = await client.query(
    `SELECT id FROM courses WHERE id = $1 AND is_published = true`,
    [courseId]
);
if (courseResult.rowCount === 0) {
    throw new ApiError(404, "Course not found or not available");
}

    const completion = getProfileCompletion(profileResult.rows[0]);
    if (!completion.isComplete) {
        throw new ApiError(
            403,
            "Complete your profile before enrollment",
            completion
        );
    }

    const existingEnrollment = await findEnrollmentByStudentCourse(
        client,
        studentId,
        courseId
    );
    if (existingEnrollment.rowCount > 0) {
        throw new ApiError(409, "Student already enrolled in this course");
    }

     // 4. ← MISSING — Enrollment limit check
    const activeCount = await countActiveEnrollmentsByStudent(client, studentId);
    if (activeCount >= 2) {
        throw new ApiError(403, "You cannot be enrolled in more than 2 courses at a time");
    }


    const enrollment = await createEnrollment(client, studentId, courseId);
    return enrollment.rows[0];
};

export { enrollStudentInCourse };
