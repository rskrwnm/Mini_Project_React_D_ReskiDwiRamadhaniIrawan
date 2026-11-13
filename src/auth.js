// Helper sesi admin. Dipakai hanya untuk memilih tampilan.
// Keamanan sebenarnya tetap dijaga server (JWT + pengecekan akun di database).

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const isLoggedIn = () =>
  !!localStorage.getItem("isLoggedIn") && !!localStorage.getItem("token");

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("user");
};
