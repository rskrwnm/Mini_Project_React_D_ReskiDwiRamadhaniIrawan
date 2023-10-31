import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { addItem } from '../features/cartSlice';
import Swal from 'sweetalert2';

import Card from '../components/Card'; 

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const fetchData = async () => {
    try {
      let apiUrl = "https://6535cec8c620ba9358ecad63.mockapi.io/product";

      if (selectedCategory !== "Semua") { 
        apiUrl += `?category=${selectedCategory}`;
      }

      const response = await axios.get(apiUrl);

      setProducts(response.data); 
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!isLoggedIn) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Sorry, you need to Sign-in to add items to the cart.",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#1976D2",
        confirmButtonText: "Log in",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return;
    }

    const newItem = {
      id: product?.id,
      name: product?.name,
      image: product?.image,
      category: product?.category,
      description: product?.description,
      price: product?.price,
    };

    dispatch(addItem(newItem));
    navigate("/cart");
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  return (
    <div className="container mx-auto py-5">
      <div className="flex items-center justify-between">
        <div className="w-1/2 p-4">
          <div className="text-left">
            <h1 className="text-6xl font-bold text-black">
              Selamat Datang Di RentCampy
            </h1><br></br>
            <p className="text-lg text-gray-800">
              Temukan perlengkapan camping berkualitas dengan harga terjangkau.
            </p>
          </div>
        </div>
        <div className="w-2/5">
          <img src="welcome-image.png" alt="Welcome Image" className="w-96" />
        </div>
      </div>
      <div className="my-4">
        <label className="font-semibold text-gray-800">Category:</label>
        <select
          className="ml-2 p-2 border rounded-md"
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="Semua">Semua</option>
          <option value="Tenda">Tenda</option>
          <option value="Peralatan Masak">Peralatan Masak</option>
          <option value="Alat Tidur">Alat Tidur</option>
        </select>
      </div>
      <div className="w-full h-screen">
  {loading ? (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full border-t-4 border-b-4 border-gray-600 h-12 w-12"></div>
      <p className="text-center pt-4 text-2xl text-gray-600">Loading...</p>
    </div>
  ) : (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <Card
          key={product.id}
          id={product.id}
          name={product.name}
          category={product.category}
          image={product.image}
          price={product.price}
          showCartButton={true}
          handleNavigateDetails={() => {
            navigate(`/productdetail/${product.id}`, {
              state: {product},
            });
          }}
          handleAddtoCart={() => handleAddToCart(product)}
        />
      ))}
    </div>
  )}
</div>
</div>

  );
};

export default Home;
