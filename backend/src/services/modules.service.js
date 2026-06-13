import {ApiError} from '../utils/ApiError.js';
import { pool } from '../db/pool.js';
import {
    findModulesByCourseId,
    insertModule,
    updateModuleById,
    deleteModuleAndShift,
    reorderModulesInDb,
    findModuleById
} from '../repositories/modules.repository.js';
import {z} from 'zod';

// creating a validation schema then classes for modules

const moduleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    
});

class ModulesService {

    async getModulesByCourseId(courseId) {
        const client = await pool.connect();

        try {
            const { rows: modules } = await findModulesByCourseId(client, courseId);
            return modules;

        } catch(error) {
            throw new ApiError(500, "Failed to retrieve modules");
        }

        finally {
            client.release();
        }
    }

// backend/src/services/module.service.js

async createModule(courseId, title) {
    // Only validate the fields the frontend is allowed to send
    const parsed = moduleSchema.safeParse({ title });

    if (!parsed.success) {
        throw new ApiError(400, "Invalid module data", { errors: parsed.error.errors });
    }

    const client = await pool.connect();

    try {
        const safeData = parsed.data;
        // Pass only courseId and title to the repository
        const { rows } = await insertModule(client, courseId, safeData.title);
        return rows[0];

    } catch (error) {
        // Log the actual error internally for debugging, but throw a clean ApiError
        console.error("Error creating module:", error);
        throw new ApiError(500, "Failed to create module");
    } finally {
        client.release();
    }
}
    async updateModule(moduleId, title, position) {
        
        const parsed = moduleSchema.safeParse({ title });
        if (!parsed.success) {
            throw new ApiError(400, "Invalid module data", { errors: parsed.error.errors });
        }
        const client = await pool.connect();
        try {
            const safeData=parsed.data;
            
            const { rows } = await updateModuleById(client, moduleId, safeData.title, position);
            if (rows.length === 0) {
                throw new ApiError(404, "Module not found");
            }
            return rows[0];
        } catch (error) {
            console.error("Error updating module:", error);
            throw new ApiError(500, "Failed to update module");
        } finally {
            client.release();
        }
    }

   async deleteModule(moduleId) {
        const client = await pool.connect();
        try {
            // Start SQL transaction
            await client.query('BEGIN');

            // 1. Get the course_id and position of the module to be deleted
            const { rows } = await findModuleById(client, moduleId);
            const course_id = rows[0]?.course_id;
            const deletedPosition = rows[0]?.position;

            if (!course_id || !deletedPosition) {
                throw new ApiError(404, "Module not found");
            }

            // 2. Delete and safely shift adjacent modules
            await deleteModuleAndShift(client, course_id, moduleId, deletedPosition);

            // Commit the transaction to save changes
            await client.query('COMMIT');
            
            return { message: "Module deleted successfully" };
        } catch (error) {
            // If anything fails, rollback the deletion so we don't leave gaps in the database
            await client.query('ROLLBACK');
            
            console.error("Error deleting module:", error);
            if (error instanceof ApiError) throw error;
            throw new ApiError(500, "Failed to delete module");
        } finally {
            client.release();
        }
    }

    // The most difficult one - updating module position

async updateModulePosition(moduleId, newPosition) {
    if (!Number.isInteger(newPosition) || newPosition < 1) {
        throw new ApiError(400, "Position must be a positive integer");
    }
        console.log(`Attempting to move module ${moduleId} to position ${newPosition}`);
    const client = await pool.connect();
    
    try {
        // 1. Find the module first so we know its current position and course
        const { rows } = await findModuleById(client, moduleId);
        if (rows.length === 0) {
            throw new ApiError(404, "Module not found");
        }
        
        const moduleToMove = rows[0];
        const oldPosition = moduleToMove.position;
        const courseId = moduleToMove.course_id;

        // If it's already in the correct spot, do nothing and return it
        if (oldPosition === newPosition) {
            return moduleToMove;
        }

        // 2. Start the Database Transaction
        await client.query('BEGIN');
        console.log(courseId, moduleId, oldPosition, newPosition);
        // 3. Execute the complex reordering logic
        const updatedModule = await reorderModulesInDb(
            client, 
            courseId, 
            moduleId, 
            oldPosition, 
            newPosition
        );

        // 4. Save everything permanently
        await client.query('COMMIT');

        return updatedModule;

    } catch (error) {
        // If anything fails (e.g. database crashes mid-update), undo everything
        await client.query('ROLLBACK');
        console.error("Failed to reorder modules:", error);
        throw new ApiError(500, "Failed to update module position", error.message);
    } finally {
        client.release();
    }
}

}

export const moduleService = new ModulesService();