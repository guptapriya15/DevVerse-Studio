import { api } from "../utils/axios";

export const logout = async () => {
  try {
    const { data } = await api.get("/api/auth/logout");

    return data;

  } catch (error) {
    console.error(
      "Logout Error:",
      error.response?.data || error.message
    );

    return null;
  }
};