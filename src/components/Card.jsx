import React, { useState } from "react";

const Card = ({
  id,
  name,
  category,
  price,
  image,
  handleNavigateDetails,
  handleAddtoCart,
  showCartButton,
}) => {
  const [quantity, setQuantity] = useState(0);

  const cardStyle = {
    backgroundColor: "white",
    color: "black",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    border: "1px solid #E5E5E5",
  };

  const priceStyle = {
    color: "#008170",
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prevQuantity) => prevQuantity - 1);
    }
  };

  return (
    <div
      id={id}
      className="max-w-sm rounded overflow-hidden shadow-lg"
      style={cardStyle}
    >
      <img
        src={image ?? "https://placehold.co/500x400"}
        alt={name}
        className="w-full h-64 object-cover"
      />
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-blue-700">{name}</h2>
        <p className="text-gray-600 mb-4">{category.join(', ')}</p>
        <div className="text-gray-800 font-semibold text-lg">Rp. {price} / Hari</div>
        {showCartButton && (
          <div className="flex justify-between items-center m-auto mb-2">
            <button
              onClick={handleNavigateDetails}
              className="text-center px-4 py-2 mt-2 bg-blue-500 rounded hover:bg-blue-700 text-white"
            >
              Product Details
            </button>
            <button
              onClick={handleAddtoCart}
              className="text-center px-4 py-2 mt-2 bg-blue-500 rounded hover:bg-blue-700 text-white" 
            >
              Add to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
