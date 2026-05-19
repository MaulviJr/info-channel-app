const mockEnrollments = [
	{
		id: '3dce1b8f-8c17-4a4b-9b2c-111111111111',
		course_id: 'f5e36d5f-1c56-4e7d-9c25-aaaaaaaaaaaa',
		status: 'active',
		enrolled_at: '2026-05-10T10:00:00Z',
		course: {
			title: 'Frontend Foundations',
			description: 'Learn the basics of modern frontend development.',
			thumbnail_url: null,
			instructor: { name: 'Ayesha Khan' },
		},
		progress: {
			completedLectures: 8,
			totalLectures: 20,
			percent: 40,
		},
	},
	{
		id: '7c6b47e0-9b8a-4f28-9c3a-222222222222',
		course_id: 'cdbf0a2c-8869-4a2c-9f98-bbbbbbbbbbbb',
		status: 'pending_details',
		enrolled_at: '2026-05-12T09:30:00Z',
		course: {
			title: 'Data Literacy Essentials',
			description: 'Core data skills for modern students.',
			thumbnail_url: null,
			instructor: { name: 'Imran Ali' },
		},
		progress: {
			completedLectures: 0,
			totalLectures: 16,
			percent: 0,
		},
	},
	{
		id: 'a3d5f2c1-0c8d-4b6e-93a8-333333333333',
		course_id: '9c8f2e5b-5b61-4c13-98c7-cccccccccccc',
		status: 'completed',
		enrolled_at: '2026-04-02T14:20:00Z',
		course: {
			title: 'Communication Skills for Tech',
			description: 'Build clarity and confidence in your communication.',
			thumbnail_url: null,
			instructor: { name: 'Sara Noor' },
		},
		progress: {
			completedLectures: 12,
			totalLectures: 12,
			percent: 100,
		},
	},
];

const getMyEnrollments = async () => {
	// TODO: Replace mock data once GET /api/v1/enrollments/my is available.
	return mockEnrollments;

	// Example:
	// const response = await axiosInstance.get('/enrollments/my');
	// return response.data;
};

export { getMyEnrollments };
