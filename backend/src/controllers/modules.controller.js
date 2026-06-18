import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { moduleService } from "../services/modules.service.js";


const getModulesByCourseId = asyncHandler(async (req, res) => {
    const {courseId} = req.params;
    const modules = await moduleService.getModulesByCourseId(courseId);

    return res.status(200).json(new ApiResponse(200, { modules },"Modules retrieved successfully"));
    
});

// backend/src/controllers/module.controller.js

const createModule = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    // Ignore position even if a malicious frontend tries to send it
    const { title } = req.body; 

    const newModule = await moduleService.createModule(courseId, title);

    return res.status(201).json(
        new ApiResponse(201, { module: newModule }, "Module created successfully")
    );
});

const updateModule = asyncHandler(async (req, res) => {
    const {moduleId} = req.params;
    const {title, position} = req.body;
    // console.log("Received request to reorder module with data:", req.body);

    //  console.log(`Module ID from params: ${moduleId}`);
    const updatedModule = await moduleService.updateModule(moduleId, title, position);

    return res.status(200).json(new ApiResponse(200, { module: updatedModule }, "Module updated successfully"));
});

const deleteModule = asyncHandler(async (req, res) => {
    const {moduleId} = req.params;
    console.log(`Received request to delete module with ID: ${moduleId}`);
    await moduleService.deleteModule(moduleId);

    return res.status(200).json(new ApiResponse(200, null, "Module deleted successfully"));
});

const reorderModules = asyncHandler(async (req, res) => {

    console.log("Received request to reorder module with data:", req.body);
    const {moduleId,newPosition} = req.body;
    console.log(`Module ID from body: ${moduleId}, New Position: ${newPosition}`);

    const reorderedModule = await moduleService.updateModulePosition(moduleId, newPosition);;

    return res.status(200).json(new ApiResponse(200, { module: reorderedModule }, "Modules reordered successfully"));
});

// const reorderModules= asyncHandler(async (req, res) => {
    
//     const { moduleId,newPosition } = req.body;
//     const { courseId } = req.params;
//     

//     // Return full list instead of single module
//     const modules = await moduleService.getModulesByCourseId(courseId);

//     return res.status(200).json(
//         new ApiResponse(200, { modules }, 'Modules reordered successfully')
//     );
// });

export {
    getModulesByCourseId,
    createModule,
    updateModule,
    deleteModule,
    reorderModules
}