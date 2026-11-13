import Swal from "sweetalert2";
import api from "./api";

// Nomor WhatsApp admin diatur di dashboard (tabel settings), bukan ditulis di kode.
export const fetchWaNumber = () =>
  api
    .get("/settings/public")
    .then((res) => res.data.wa_admin || "")
    .catch(() => "");

export const buildWaLink = (number, product) => {
  const text = `Halo Admin RentCampy, saya ingin menyewa ${product.name}. Mohon info ketersediaan dan cara sewanya. Terima kasih.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const openWhatsApp = (number, product) => {
  if (!number) {
    Swal.fire({
      icon: "info",
      title: "Belum tersedia",
      text: "Nomor WhatsApp admin belum diatur. Silakan coba lagi nanti.",
    });
    return;
  }
  window.open(buildWaLink(number, product), "_blank", "noopener");
};

export { formatRupiah } from "./format";
