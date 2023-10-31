import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const product = location.state.product;

  if (!product) {
    return <div className="text-center text-red-500 text-2xl mt-8">Produk tidak ditemukan</div>;
  }

  useEffect(() => {
    document.title = "Detail Page";
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-2xl p-8 rounded-lg shadow-lg bg-white">
        <div className="flex flex-col items-center">
          {product?.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded-md"
            />
          )}
          <h1 className="text-3xl font-semibold text-blue-700 mt-4">
            {product.name}
          </h1>
          <p className="text-gray-600 my-2">{product.category}</p>
          <p className="text-blue-700 font-semibold text-2xl">
            Rp. {product.price}
          </p>
          <p className="text-justify mt-4">{product.description}</p>
          <button
            onClick={() => {
              navigate("/");
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 mt-6 rounded-full"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
