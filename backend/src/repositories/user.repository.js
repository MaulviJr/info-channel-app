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
