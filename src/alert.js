import Swal from "sweetalert2";

export const notifySuccess = (title, text) =>
  Swal.fire({ icon: "success", title, text, timer: 1800, showConfirmButton: false });

export const notifyError = (text, title = "Oops...") =>
  Swal.fire({ icon: "error", title, text });

export const notifyWarning = (text, title = "Perhatian") =>
  Swal.fire({ icon: "warning", title, text });

// Mengembalikan true jika admin menekan "Ya, hapus".
export const confirmDelete = (text, title = "Hapus data ini?") =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    reverseButtons: true,
  }).then((result) => result.isConfirmed);
