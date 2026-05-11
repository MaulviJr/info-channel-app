const requiredProfileFields = [
    { key: "cell_number", label: "cell_number" },
    { key: "date_of_birth", label: "date_of_birth" },
    { key: "cnic", label: "cnic" },
    { key: "father_name", label: "father_name" },
    { key: "father_cell_number", label: "father_cell_number" },
    { key: "address", label: "address" },
    { key: "education", label: "education" },
    { key: "lead_source", label: "lead_source" },
];

const getProfileCompletion = (profile) => {
    const missingFields = requiredProfileFields
        .filter(({ key }) => {
            const value = profile?.[key];
            if (value === null || value === undefined) {
                return true;
            }

            if (typeof value === "string" && value.trim().length === 0) {
                return true;
            }

            return false;
        })
        .map(({ label }) => label);

    return {
        isComplete: missingFields.length === 0,
        missingFields,
    };
};

export { getProfileCompletion };
