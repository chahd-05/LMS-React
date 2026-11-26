import client from "../api";

export const getUsersApi = () => {
  return client.get("/users");
};

export const createUserApi = (userData) => {
  return client.post("/auth/register", userData);
};

export const updateUserApi = (userId, userData) => {
  return client.put(`/users/${userId}`, userData);
};

export const updateUserStatusApi = (userId, status) => {
  return client.patch(`/users/${userId}/status`, { status });
};