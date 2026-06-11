import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { lectureService } from "../services/lectures.service.js";

// GET /api/v1/modules/:moduleId/lectures
const getLecturesForModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    
    const lectures = await lectureService.getLecturesByModule(moduleId);
    
    return res.status(200).json(
        new ApiResponse(200, { lectures }, "Lectures fetched successfully")
    );
});

// GET /api/v1/lectures/:id
const getLecture = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const lecture = await lectureService.getLectureById(id);
    
    return res.status(200).json(
        new ApiResponse(200, { lecture }, "Lecture fetched successfully")
    );
});

// POST /api/v1/lectures
// Body: { courseId, moduleId, title, position, isPreview, durationSec }
// File: video file (optional, handled by multer)
const createLecture = asyncHandler(async (req, res) => {
    // We pass req.body for the text data, and req.file?.path for the video upload
    const lecture = await lectureService.createLecture(req.body, req.file?.path);
    
    return res.status(201).json(
        new ApiResponse(201, { lecture }, "Lecture created successfully")
    );
});

// PUT /api/v1/lectures/:id
// Body: { title, isPreview, durationSec } (all optional)
// File: new video file (optional)
const updateLecture = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    // console.log(req.params);
    const lecture = await lectureService.updateLectureDetails(lectureId, req.body, req.file?.path);
    
    return res.status(200).json(
        new ApiResponse(200, { lecture }, "Lecture updated successfully")
    );
});

// PATCH /api/v1/lectures/:id/reorder
// Body: { newPosition }
const reorderLecture = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { newPosition } = req.body;
    
    const updatedLecture = await lectureService.updateLecturePosition(lectureId, newPosition);
    
    return res.status(200).json(
        new ApiResponse(200, { lecture: updatedLecture }, "Lecture position updated")
    );
});

// DELETE /api/v1/lectures/:id
const deleteLecture = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    
    await lectureService.deleteLecture(lectureId);
    
    return res.status(200).json(
        new ApiResponse(200, null, "Lecture deleted successfully")
    );
});

export {
    getLecturesForModule,
    getLecture,
    createLecture,
    updateLecture,
    reorderLecture,
    deleteLecture
};