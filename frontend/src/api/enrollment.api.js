import api from './axios';

/**
 * Create an enrollment for the current student.
 * @param {Object} payload
 */
const createEnrollmentAPI = async (payload) => {
	const response = await api.post('/enrollments', payload);
	return response;
};

/**
 * Update the enrollment status (admin only).
 * @param {string} enrollmentId
 * @param {Object} payload
 */
const updateEnrollmentStatusAPI = async (enrollmentId, payload) => {
	const response = await api.patch(`/enrollments/${enrollmentId}/status`, payload);
	return response;
};

/**
 * Update the payment status (admin only).
//  * @param {string} enrollmentId
//  * @param {Object} payload
//  */
// const updateEnrollmentPaymentStatusAPI = async (enrollmentId, payload) => {
// 	const response = await api.patch(`/enrollments/${enrollmentId}/payment-status`, payload);
// 	return response;
// };

/**
 * Get a single enrollment by id.
 * @param {string} enrollmentId
 */
const getEnrollmentByIdAPI = async () => {
	console.log('Fetching enrollment details for ID:',);
	const response = await api.get(`/enrollments/`);
	console.log('Enrollment details:', response);
	return response;
};

const getMyEnrollmentsAPI = async () => {
	console.log('Fetching my enrollments');
	const response = await api.get('/enrollments/my');
	console.log('My enrollments:', response.data.data);
	return response;
};

/**
 * Delete an enrollment by id (admin only).
 * @param {string} enrollmentId
 */
const deleteEnrollmentAPI = async (enrollmentId) => {
	const response = await api.delete(`/enrollments/${enrollmentId}`);
	return response;
};

export {
	createEnrollmentAPI,
	updateEnrollmentStatusAPI,
	// updateEnrollmentPaymentStatusAPI,
	getEnrollmentByIdAPI,
	deleteEnrollmentAPI,
	getMyEnrollmentsAPI
};
