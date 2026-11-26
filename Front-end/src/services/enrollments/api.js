import client from "../api";

export const getMyEnrollmentsApi = async () => {
  const response = await client.get("/enrollments/me");
  return response.data;
};