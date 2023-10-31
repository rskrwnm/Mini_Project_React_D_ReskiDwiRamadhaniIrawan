export async function fetchDataFromAPI() {
    try {
      const response = await fetch('https://6535cec8c620ba9358ecad63.mockapi.io/product');
      if (!response.ok) {
        throw new Error('Gagal mengambil data produk');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
  