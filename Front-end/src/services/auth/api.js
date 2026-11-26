
import client from "../api";

export const loginApi = async (payload) => {
  const response = await client.post("/auth/login", payload);
  return response.data;
};

export const registerApi = async (payload) => {
  const response = await client.post("/auth/register", payload);
  return response.data;
};

export const getCurrentUserApi = async () => {
  const response = await client.get("/auth/me");
  return response.data;
};

