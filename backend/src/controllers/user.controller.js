import fs from "fs/promises";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { pool } from "../db/pool.js";
import { uploadImage } from "../utils/cloudinary.js";

const emptyToUndefined = (value) => {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
};

const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    profilePictureUrl: z.preprocess(emptyToUndefined, z.string().url().optional()),
    cellNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    whatsappNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    dateOfBirth: z.preprocess(emptyToUndefined, z.string().optional()),
    education: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    cnic: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    religion: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
    fatherName: z.preprocess(emptyToUndefined, z.string().max(255).optional()),
    fatherCellNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    fatherWhatsappNumber: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    fatherCnic: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    fatherOccupation: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    address: z.preprocess(emptyToUndefined, z.string().optional()),
    leadSource: z.preprocess(
        emptyToUndefined,
        z.enum(["Sign Board", "Social Media", "Friends", "Teacher", "Other"]).optional()
    ),
});

const generateGrNumber = () => {
    const year = new Date().getFullYear();
    const random = crypto.randomInt(100000, 1000000);
    return `GR-${year}-${random}`;
};


const registerUser = asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new ApiError(400, "Validation failed", parsed.error.issues);
    }

    const {
        name,
        email,
        password,
        profilePictureUrl,
        cellNumber,
        whatsappNumber,
        dateOfBirth,
        education,
        cnic,
        religion,
        fatherName,
        fatherCellNumber,
        fatherWhatsappNumber,
        fatherCnic,
        fatherOccupation,
        address,
        leadSource,
    } = parsed.data;

    const role = "student";
    let uploadedProfileUrl = profilePictureUrl;

    if (req.file?.path) {
        const uploadResult = await uploadImage(req.file.path, {
            public_id: `profiles/${email.replace(/[^a-zA-Z0-9-_]/g, "-")}-${Date.now()}`,
        });
        uploadedProfileUrl = uploadResult.secure_url;
        await fs.unlink(req.file.path).catch(() => null);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const existingUser = await client.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );
        if (existingUser.rowCount > 0) {
            throw new ApiError(409, "Email already exists");
        }

        if (cnic) {
            const existingCnic = await client.query(
                "SELECT user_id FROM student_profiles WHERE cnic = $1",
                [cnic]
            );
            if (existingCnic.rowCount > 0) {
                throw new ApiError(409, "CNIC already exists");
            }
        }

        let grNumber = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
            const candidate = generateGrNumber();
            const existingGr = await client.query(
                "SELECT user_id FROM student_profiles WHERE gr_number = $1",
                [candidate]
            );
            if (existingGr.rowCount === 0) {
                grNumber = candidate;
                break;
            }
        }

        if (!grNumber) {
            throw new ApiError(500, "Failed to generate GR number");
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const userInsert = await client.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
            [name, email, passwordHash, role]
        );

        const user = userInsert.rows[0];

        const profileInsert = await client.query(
            "INSERT INTO student_profiles (user_id, profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number",
            [
                user.id,
                uploadedProfileUrl || null,
                cellNumber || null,
                whatsappNumber || null,
                dateOfBirth || null,
                education || null,
                cnic || null,
                religion || null,
                fatherName || null,
                fatherCellNumber || null,
                fatherWhatsappNumber || null,
                fatherCnic || null,
                fatherOccupation || null,
                address || null,
                leadSource || null,
                grNumber,
            ]
        );

        await client.query("COMMIT");

        res.status(201).json(
            new ApiResponse(201, {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: {
                    profilePictureUrl: profileInsert.rows[0].profile_picture_url,
                    cellNumber: profileInsert.rows[0].cell_number,
                    whatsappNumber: profileInsert.rows[0].whatsapp_number,
                    dateOfBirth: profileInsert.rows[0].date_of_birth,
                    education: profileInsert.rows[0].education,
                    cnic: profileInsert.rows[0].cnic,
                    religion: profileInsert.rows[0].religion,
                    fatherName: profileInsert.rows[0].father_name,
                    fatherCellNumber: profileInsert.rows[0].father_cell_number,
                    fatherWhatsappNumber: profileInsert.rows[0].father_whatsapp_number,
                    fatherCnic: profileInsert.rows[0].father_cnic,
                    fatherOccupation: profileInsert.rows[0].father_occupation,
                    address: profileInsert.rows[0].address,
                    leadSource: profileInsert.rows[0].lead_source,
                    grNumber: profileInsert.rows[0].gr_number,
                },
            })
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});


export {
    registerUser,
}