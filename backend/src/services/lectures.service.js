import { z } from "zod";
import { ApiError } from "../utils/ApiError.js";
import {pool} from "../db/pool.js";
// Assuming you have an upload helper like this in your cloudinary.js
import { uploadVideo } from "../utils/cloudinary.js"; 
import {
    findLecturesByModuleId,
    findLectureById,
    insertLecture,
    updateLectureById,
    reorderLecturesInDb,
    deleteLectureAndShift
} from "../repositories/lectures.repository.js";

// --- Validation Schemas ---
// We use z.coerce.boolean() because form-data often sends booleans as strings ("true"/"false")
const lectureBaseSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(255),
    isPreview: z.coerce.boolean().default(false),
    videoUrl: z.string().url().optional().nullable(),
    durationSec: z.coerce.number().int().min(0).default(0)
});

const createLectureSchema = lectureBaseSchema.extend({
    courseId: z.string().uuid("Invalid course ID"),
    moduleId: z.string().uuid("Invalid module ID"),
    // position: z.coerce.number().int().min(1, "Position must be a positive integer"),
});

const updateLectureSchema = lectureBaseSchema.partial();

class LectureService {
    
    async getLecturesByModule(moduleId) {
        if (!z.string().uuid().safeParse(moduleId).success) {
            throw new ApiError(400, "Invalid module ID");
        }
        
        const client = await pool.connect();
        try {
            const { rows } = await findLecturesByModuleId(client, moduleId);
            return rows;
        } finally {
            client.release();
        }
    }

    async getLectureById(lectureId) {
        const client = await pool.connect();
        try {
            const { rows } = await findLectureById(client, lectureId);
            if (rows.length === 0) throw new ApiError(404, "Lecture not found");
            return rows[0];
        } finally {
            client.release();
        }
    }

    async createLecture(data) {
    console.log('Creating lecture with data:', data);
    
    // Make sure your createLectureSchema (Zod/Joi) is updated to accept videoUrl as a string
    const parsed = createLectureSchema.safeParse(data);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    // Default durationSec to 0 if not provided, since we can't fetch it from Cloudinary anymore
    let { courseId, title, moduleId, isPreview = false, videoUrl, durationSec = 0 } = parsed.data;

    const client = await pool.connect();
    try {
        const { rows } = await insertLecture(
            client, moduleId, courseId, title, videoUrl, durationSec, isPreview
        );
        return rows[0];
    } catch (error) {
        if (error.code === '23505') {
            throw new ApiError(400, "A lecture already exists at this position in this module.");
        }
        throw new ApiError(500, `Database error: ${error.message}`);
    } finally {
        client.release();
    }
}

    async updateLectureDetails(lectureId, data) {
        const parsed = updateLectureSchema.safeParse(data);
        if (!parsed.success) {
            throw new ApiError(400, "Validation failed", parsed.error.issues);
        }

        const client = await pool.connect();
        try {
            // 1. Get existing lecture to fall back on current values if not provided
            console.log(`Updating lecture ${lectureId} with data:`, data);
            const { rows: existingRows } = await findLectureById(client, lectureId);
            if (existingRows.length === 0) throw new ApiError(404, "Lecture not found");
            const existing = existingRows[0];

            let videoUrl = parsed.data.videoUrl ?? existing.video_url;
            let durationSec = parsed.data.durationSec ?? existing.duration_sec;

            // 2. Handle new video upload
            // if (localFilePath) {
            //     const uploadResult = await uploadVideo(localFilePath);
            //     if (!uploadResult) throw new ApiError(500, "Failed to upload new video");
            //     videoUrl = uploadResult.secure_url;
            //     durationSec = Math.round(uploadResult.duration || 0);
            // }

            // 3. Perform Update
            const { rows } = await updateLectureById(
                client,
                lectureId,
                parsed.data.title ?? existing.title,
                durationSec,
                parsed.data.isPreview ?? existing.is_preview
            );
            
            return rows[0];
        } finally {
            client.release();
        }
    }

    async updateLecturePosition(lectureId, newPosition) {
        newPosition = Number(newPosition);
        if (!Number.isInteger(newPosition) || newPosition < 1) {
            throw new ApiError(400, "Position must be a positive integer");
        }

        const client = await pool.connect();
        try {
            const { rows } = await findLectureById(client, lectureId);
            if (rows.length === 0) throw new ApiError(404, "Lecture not found");
            
            const lecture = rows[0];
            
            // If position isn't changing, do nothing to save DB load
            if (lecture.position === newPosition) return lecture;

            await client.query('BEGIN');
            const updatedLecture = await reorderLecturesInDb(
                client, 
                lecture.module_id, // Notice we scope this to the module_id
                lectureId, 
                lecture.position, 
                newPosition
            );
            await client.query('COMMIT');

            return updatedLecture;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Reorder error:", error);
            throw new ApiError(500, "Failed to reorder lectures");
        } finally {
            client.release();
        }
    }

    async deleteLecture(lectureId) {
        const client = await pool.connect();
        try {
            const { rows } = await findLectureById(client, lectureId);
            if (rows.length === 0) throw new ApiError(404, "Lecture not found");
            
            const lecture = rows[0];

            await client.query('BEGIN');
            await deleteLectureAndShift(
                client, 
                lecture.module_id, 
                lectureId, 
                lecture.position
            );
            await client.query('COMMIT');

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Delete shift error:", error);
            throw new ApiError(500, "Failed to delete lecture");
        } finally {
            client.release();
        }
    }
}

export const lectureService = new LectureService();

