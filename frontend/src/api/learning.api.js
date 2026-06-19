import api from "./axios";

const getLearningCourseAPI = async (courseId) => {
  const response = await api.get(`/learning/courses/${courseId}`);
  return response;
}

const updateLectureProgressAPI = async ({lectureId,courseId, isCompleted}) => {
    // console.log(`API call to update progress for lecture ${lectureId} in course ${courseId} to isCompleted=${isCompleted}`);
    console.log("API call to update progress with parameters:", { lectureId, courseId, isCompleted });
 const response = await api.post("/learning/progress", {
        courseId,
        lectureId,
        isCompleted
    });
 return response;
}

export {
    getLearningCourseAPI,
    updateLectureProgressAPI
}