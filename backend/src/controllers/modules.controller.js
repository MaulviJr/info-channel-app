import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { moduleService } from "../services/modules.service.js";


const getModulesByCourseId = asyncHandler(async (req, res) => {
    const {courseId} = req.params;
    const modules = await moduleService.getModulesByCourseId(courseId);

    return res.status(200).json(new ApiResponse(200, { modules },"Modules retrieved successfully"));
    
});

const createModule = asyncHandler(async (req, res) => {
    const {courseId} = req.params;
    const {title, position} = req.body;

    const newModule = await moduleService.createModule(courseId, title, position);

    return res.status(201).json(new ApiResponse(201, { module: newModule }, "Module created successfully"));
});

const updateModule = asyncHandler(async (req, res) => {
    const {moduleId} = req.params;
    const {title, position} = req.body;

    const updatedModule = await moduleService.updateModule(moduleId, title, position);

    return res.status(200).json(new ApiResponse(200, { module: updatedModule }, "Module updated successfully"));
});

const deleteModule = asyncHandler(async (req, res) => {
    const {moduleId} = req.params;

    await moduleService.deleteModule(moduleId);

    return res.status(200).json(new ApiResponse(200, null, "Module deleted successfully"));
});

const reorderModules = asyncHandler(async (req, res) => {
    const {moduleId} = req.params;
    const {newPosition} = req.body;

    const reorderedModule = await moduleService.updateModulePosition(moduleId, newPosition);

    return res.status(200).json(new ApiResponse(200, { module: reorderedModule }, "Modules reordered successfully"));
});

export {
    getModulesByCourseId,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
}