export const findOneUserByEmail = (client, email) =>
    client.query(
        "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
        [email]
    );

export const findOneUserByEmailMinimal = (client, email) =>
    client.query("SELECT id FROM users WHERE email = $1", [email]);

export const findOneStudentProfileByCnic = (client, cnic) =>
    client.query("SELECT user_id FROM student_profiles WHERE cnic = $1", [cnic]);

export const findOneStudentProfileByGrNumber = (client, grNumber) =>
    client.query(
        "SELECT user_id FROM student_profiles WHERE gr_number = $1",
        [grNumber]
    );

export const createUser = (client, name, email, passwordHash, role) =>
    client.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
        [name, email, passwordHash, role]
    );

export const createStudentProfile = (
    client,
    userId,
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
    grNumber
) =>
    client.query(
        "INSERT INTO student_profiles (user_id, profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number",
        [
            userId,
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
            grNumber,
        ]
    );

export const findStudentProfileByUserId = (client, userId) =>
    client.query(
        "SELECT user_id, profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number FROM student_profiles WHERE user_id = $1",
        [userId]
    );

export const updateStudentProfile = (
    client,
    userId,
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
    leadSource
) =>
    client.query(
        "UPDATE student_profiles SET profile_picture_url = $1, cell_number = $2, whatsapp_number = $3, date_of_birth = $4, education = $5, cnic = $6, religion = $7, father_name = $8, father_cell_number = $9, father_whatsapp_number = $10, father_cnic = $11, father_occupation = $12, address = $13, lead_source = $14, updated_at = CURRENT_TIMESTAMP WHERE user_id = $15 RETURNING user_id, profile_picture_url, cell_number, whatsapp_number, date_of_birth, education, cnic, religion, father_name, father_cell_number, father_whatsapp_number, father_cnic, father_occupation, address, lead_source, gr_number",
        [
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
            userId,
        ]
    );

export const updateUserRefreshToken = (
    client,
    userId,
    refreshToken,
    refreshTokenExpiresAt
) =>
    client.query(
        "UPDATE users SET refresh_token = $1, refresh_token_expires_at = $2 WHERE id = $3",
        [refreshToken, refreshTokenExpiresAt, userId]
    );


export const listUsers = (client, limit, offset) =>
    client.query(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset]
    );

export const findOneUserById = (client, userId) =>
    client.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
        [userId]
    );

export const deleteUserById = (client, userId) =>
    client.query("DELETE FROM users WHERE id = $1", [userId]);

export const listStudentsWithProfiles = (client, limit, offset) =>
    client.query(
        `
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.created_at,

            sp.cell_number,
            sp.date_of_birth,
            sp.cnic,
            sp.father_name,
            sp.father_cell_number,
            sp.address,
            sp.education,
            sp.lead_source

        FROM users u

        LEFT JOIN student_profiles sp
        ON u.id = sp.user_id

        WHERE u.role = 'student'

        ORDER BY u.created_at DESC

        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
    );
