import { ApiError } from "../utils/ApiError.js";
import { findStudentProfileByUserId } from "../repositories/user.repository.js";
import {
    createEnrollment,
    findEnrollmentByStudentCourse,
    countActiveEnrollmentsByStudent,   // ← was missing
    updateEnrollmentStatus as updateEnrollmentStatusInRepo,
} from "../repositories/enrollment.repository.js";
import { getProfileCompletion } from "./studentProfile.service.js";

const enrollStudentInCourse = async (client, studentId, courseId) => {

    // 1. Profile exists?
    const profileResult = await findStudentProfileByUserId(client, studentId);
    if (profileResult.rowCount === 0) {
        throw new ApiError(404, "Student profile not found");
    }

    // 2. Profile complete?
    const completion = getProfileCompletion(profileResult.rows[0]);
    if (!completion.isComplete) {
        throw new ApiError(403, "Complete your profile before enrollment", completion);
    }

    // 3. Course exists and is published?
    const courseResult = await client.query(
        `SELECT id FROM courses WHERE id = $1 AND is_published = true`,
        [courseId]
    );
    if (courseResult.rowCount === 0) {
        throw new ApiError(404, "Course not found or not available");
    }

    // 4. Already enrolled in this course?
    const existingEnrollment = await findEnrollmentByStudentCourse(client, studentId, courseId);
    if (existingEnrollment.rowCount > 0) {
        throw new ApiError(409, "Already enrolled in this course");
    }

    // 5. Enrollment limit check
    const activeCount = await countActiveEnrollmentsByStudent(client, studentId);
    if (activeCount >= 2) {
        throw new ApiError(403, "Cannot be enrolled in more than 2 courses at a time");
    }

    // 6. All checks passed — create enrollment
    const enrollment = await createEnrollment(client, studentId, courseId);
    return enrollment.rows[0];
};

export { enrollStudentInCourse };

const updateEnrollmentStatus = async (client, enrollmentId, status) => {
    const result = await updateEnrollmentStatusInRepo(
        client,
        enrollmentId,
        status
    );

    if (result.rowCount === 0) {
        throw new ApiError(404, "Enrollment not found");
    }

    return result.rows[0];
};

export { updateEnrollmentStatus };