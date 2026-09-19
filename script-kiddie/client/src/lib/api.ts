import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRoute = originalRequest?.url?.includes("/auth/");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      if (isRefreshing) {
        await new Promise<void>((resolve) => refreshQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      try {
        await api.post("/auth/refresh");
        refreshQueue.forEach((cb) => cb());
        refreshQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        refreshQueue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export async function uploadAvatar(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await api.post("/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.avatarUrl as string | null;
}

export async function deleteAvatar(): Promise<void> {
  await api.delete("/profile/avatar");
}

export function getErrorMessage(error: unknown): string {

  if (axios.isAxiosError(error)) {
    console.error("API error:", error.response?.data ?? error.toJSON());
    return "Something went wrong — please try again.";
  }
  console.error("Unknown error:", error);
  return "Something went wrong — please try again.";
}

export function getMappedErrorMessage(error: unknown, messages: Record<string, string>): string {
  if (axios.isAxiosError(error)) {
    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (code && messages[code]) {
      console.error("API error:", error.response?.data);
      return messages[code];
    }
    if (error.response?.status === 429) {
      return messages.RATE_LIMITED ?? "Too many requests. Please wait a while and try again.";
    }
  }
  return getErrorMessage(error);
}
