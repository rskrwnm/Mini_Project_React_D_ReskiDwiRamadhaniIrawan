import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const Admin = () => {
    const [name, setProductName] = useState("");
    const [category, setProductCategory] = useState("");
    const [image, setProductImage] = useState(null);
    const [price, setProductPrice] = useState("");
    const [description, setdescription] = useState("");
    const [productData, setProductData] = useState([]);
    const [productToDelete, setProductToDelete] = useState(null);
    const [imageError, setImageError] = useState("");
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);

    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    useEffect(() => {
      if (!isLoggedIn) {
        navigate("/login");
      }
    }, [isLoggedIn, navigate])
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                "https://6535cec8c620ba9358ecad63.mockapi.io/product"
                );
                setProductData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
            };

            fetchData();
    }, []);

        const handleProductNameChange = (e) => {
            const value = e.target.value;  
            setProductName(value);
          };
        
          const handleProductCategoryChange = (e) => {
            setProductCategory(e.target.value);
          };
        
          const handleImageChange = async (e) => {
            const file = e.target.files[0];
        
            if (file && !file.type.startsWith("image/")) {
              setImageError("The selected file is not an image.");
            } else {
              setImageError("");
        
              const options = {
                maxSizeMB: 0.05,
                useWebWorker: true,
              };
        
              try {
                const compressedFile = await imageCompression(file, options);
                setProductImage(compressedFile);
              } catch (error) {
                console.error("Error compressing image:", error);
              }
            }
          };
        
          const handleProductPriceChange = (e) => {
            const value = e.target.value;
            setProductPrice(value);
          };
          const handledescription = (e) => {
            setdescription(e.target.value);
          };
        
        
          const handleEdit = (productId) => {
            const productToEdit = productData.find(
              (product) => product.id === productId
            );
            setEditingProduct(productToEdit);
            setProductName(productToEdit.name);
            setProductCategory(productToEdit.category[0]);
            setProductImage(null);
            setProductPrice(productToEdit.price);
            setdescription(productToEdit.description);
          };
        
          const handleSubmit = async (e) => {
            e.preventDefault();
          
            if (
              !name.trim() ||
              !category ||
              !price ||
              !description
            ) {
              alert("Please fill in all fields before adding product!");
              return;
            }
            if (!image) {
              alert("Please select an image for the product.");
              return;
            }
          
            const reader = new FileReader();
            reader.onloadend = async () => {
              const updatedProduct = {
                name,
                category: [category],
                image: reader.result ? reader.result : editingProduct.image,
                description,
                price,
              };
          
              try {
                if (editingProduct) {
                  const response = await axios.put(
                    `https://6535cec8c620ba9358ecad63.mockapi.io/product/${editingProduct.id}`,
                    updatedProduct
                  );
          
                  alert("Product updated successfully!");
          
                  const updatedProductData = productData.map((product) =>
                    product.id === response.data.id ? response.data : product
                  );
          
                  setProductData(updatedProductData);
                } else {
                  const response = await axios.post(
                    "https://6535cec8c620ba9358ecad63.mockapi.io/product",
                    updatedProduct
                  );
          
                  alert("Product added successfully!");
          
                  setProductData((prevData) => [...prevData, response.data]);
                }
          
                setEditingProduct(null);
                setProductName("");
                setProductCategory("");
                setProductImage(null);
                setProductPrice("");
                setdescription("");
              } catch (error) {
                console.error("Error adding/updating product:", error);
                alert("Failed to add/update product. Please try again later.");
              }
            };
          
            reader.readAsDataURL(image);
          };
          
          const handleDeleteConfirmation = (productId) => {
            setProductToDelete(productId);
          };
        
          const handleDelete = async () => {
            try {
              await axios.delete(
                `https://6535cec8c620ba9358ecad63.mockapi.io/product/${productToDelete}`
              );
        
              const updatedProductData = productData.filter(
                (product) => product.id !== productToDelete
              );
        
              setProductData(updatedProductData);
              setProductToDelete(null);
              alert("Product deleted successfully!");
            } catch (error) {
              console.error("Error deleting product:", error);
              alert("Failed to delete product. Please try again later.");
            }
          };

  return (
    
    <div className="w-full h-screen">
  {loading ? (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full border-t-4 border-b-4 border-gray-600 h-12 w-12"></div>
      <p className="text-center pt-4 text-2xl text-gray-600">Loading...</p>
    </div>
      ) : (
        <div>
          <form onSubmit={handleSubmit}>
            <div className="mt-14 flex flex-col items-center gap-1">
              <h4 className="mb-2 text-lg font-semibold pr-[380px]">
                Admin Dashboard
              </h4>
              <div className="flex flex-col items-center gap-1">
                <label className="pr-[395px]">Product Name</label>
                <input
                  type="text"
                  id="name"
                  onChange={handleProductNameChange}
                  value={name}
                  className="bg-white border border-gray-300 w-[500px] text-gray-900 text-sm rounded-lg p-2.5"
                />
              </div>
              <div className="pt-4">
                <label className="pr-[370px]">Product Category</label>
                <select
                  id="countries"
                  value={category}
                  onChange={handleProductCategoryChange}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg block w-[500px] p-2.5"
                >
                  <option value="">Choose...</option>
                  <option value="Tenda">Tenda</option>
                  <option value="Alat Tidur">Alat Tidur</option>
                  <option value="Peralatan Masak">Peralatan Masak</option>
                </select>
              </div>
              <div className="pt-4">
                <label className="pr-[370px]">Image Of Product</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="block w-full border rounded-lg"
                  name="image"
                />
                {imageError && <div className="text-red-500">{imageError}</div>}
              </div>
              <div>
                <label className="pr-[340px]">Description</label>
                <textarea
                  id="message"
                  value={description}
                  onChange={handledescription}
                  rows="4"
                  className="block p-2.5 mt-1 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  name="description"
                ></textarea>
              </div>
              <div className="flex flex-col items-center gap-1">
                <label className="pr-[395px]">Product Price</label>
                <input
                  type="text"
                  id="price"
                  placeholder="$ 1"
                  value={price}
                  onChange={handleProductPriceChange}
                  className="bg-white border border-gray-300 w-[500px] text-gray-900 text-sm rounded-lg p-2.5"
                  required
                />
              </div>
              <button
                type="submit"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-6 mt-4 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 w-[500px]"
              >
                Submit
              </button>
            </div>
          </form>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <h1 className="pt-20 text-center font-normal text-3xl pb-4">
              List Product
            </h1>
            <table className="w-full text-sm dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-2 py-2">No</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Image</th>
                  <th className="px-2 py-2">Description</th>
                  <th className="px-2 py-2">Price</th>
                  <th scope="col" className="px-2 py-2">
                    <span className="">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {productData.map((product, index) => (
                  <tr
                    key={index}
                    className="bg-white border-b text-center dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <td className="px-2 py-2">{index + 1}</td>
                    <td className="px-2 py-2">{product.name}</td>
                    <td className="px-2 py-2">{product.category}</td>
                    <td className="px-2 py-2 flex justify-center">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="max-w-[100px] max-h-[100px] rounded-full"
                        />
                      )}
                    </td>
                    <td className="px-2 py-2">{product.description}</td>
                    <td className="px-2 py-2">{product.price}</td>
                    <td className="px-2 py-2">
                      <a
                        href="#"
                        onClick={() => handleEdit(product.id)}
                        className="pr-2 font-medium text-green-600 dark:text-blue-500 hover:underline"
                      >
                        Edit
                      </a>
                      <a
                        href="#"
                        onClick={() => {
                          handleDeleteConfirmation(product.id);
                        }}
                        className="font-medium text-red-600 dark:text-blue-500 hover:underline"
                      >
                        Delete
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productToDelete !== null && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                  <p className="text-lg font-semibold mb-2">
                    Apakah Anda ingin menghapus produk ini?
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={handleDelete}
                      className="text-red-600 dark:text-red-400 font-medium mr-2"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setProductToDelete(null)}
                      className="text-blue-600 dark:text-blue-400 font-medium"
                    >
                      Tidak
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default Admin;