export const defaultCourseFormValues = {
  title: '',
  description: '',
  category: '',
  admission_fee: '',
  monthly_fee: '',
  board_registration: 'None',
};

export const courseToFormValues = (course = {}) => ({
  title: course.title || '',
  description: course.description || '',
  category: course.category || '',
  admission_fee:
    course.admission_fee !== null && course.admission_fee !== undefined
      ? String(course.admission_fee)
      : '',
  monthly_fee:
    course.monthly_fee !== null && course.monthly_fee !== undefined
      ? String(course.monthly_fee)
      : '',
  board_registration: course.board_registration || 'None',
});