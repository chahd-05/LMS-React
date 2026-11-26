import client from "../api";

export const getCoursesApi = (role) => {
  if (role === "admin") {
    return client.get("/courses/catalog");
  }

  if (role === "trainer") {
    return client.get("/trainer/courses");
  }

  return client.get("/courses");
};

export const createCourseApi = (courseData) => {
  return client.post("/courses", courseData);
};

export const updateCourseApi = (courseId, courseData) => {
  return client.put(`/courses/${courseId}`, courseData);
};

export const updateCourseStatusApi = (courseId, status) => {
  return client.patch(`/courses/${courseId}/${status}`);
};