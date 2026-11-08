// Helper sesi. Dipakai hanya untuk memilih tampilan (menu/layout).
// Keamanan sebenarnya tetap dijaga server (JWT + role di database).

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const isLoggedIn = () =>
  !!localStorage.getItem("isLoggedIn") && !!localStorage.getItem("token");

export const isAdminUser = () =>
  isLoggedIn() && getStoredUser()?.role === "admin";

export const homePathFor = () => (isAdminUser() ? "/admin" : "/");

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
};
