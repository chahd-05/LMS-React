
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    token,
  } = options;

  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const response = await fetch(
    `${API_BASE_URL}${normalizedPath}`,
    {
      method,
      headers,
      body: body !== undefined
        ? JSON.stringify(body)
        : undefined,
    }
  );

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      responseData?.message || `Request failed: ${response.status}`
    );

    error.status = response.status;
    error.details = responseData?.errors || null;

    throw error;
  }

  return responseData;
}
