import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem } from '../features/cartSlice';
import Swal from 'sweetalert2';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const isLoggedIn = localStorage.getItem('isLoggedIn');

  const [showCheckoutPopup, setShowCheckoutPopup] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [rentalStartDate, setRentalStartDate] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    document.title = 'Cart Page';
  }, []);

  const handleRent = (index) => {
    setShowCheckoutPopup(true);
    setSelectedItemIndex(index);
  };

  const handleRemoveItem = (index) => {
    const selectedProduct = items[index];
    const quantity = quantities[index] || 1;

    dispatch(removeItem(selectedProduct));

    Swal.fire({
      icon: 'success',
      title: 'Item Removed',
      text: `The item ${quantity} ${selectedProduct.name} has been removed from your cart.`,
      confirmButtonText: 'OK',
    }).then(() => {
      setShowCheckoutPopup(false);
      setSelectedItemIndex(null);
      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [index]: 1,
      }));
      setDeliveryAddress('');
      setRentalStartDate('');
      setRentalEndDate('');
    });
  };

  const handleConfirmOrder = (index) => {
    setDeliveryAddress('');
    setRentalStartDate('');
    setRentalEndDate('');

    Swal.fire({
      icon: 'success',
      title: 'Order Successful',
      text: `Your order for ${quantities[index]} ${items[index].name} has been confirmed successfully.`,
      confirmButtonText: 'OK',
    }).then(() => {
      setShowCheckoutPopup(false);
      setSelectedItemIndex(null);
    });
  };

  const handleQuantityChange = (index, newQuantity) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [index]: newQuantity,
    }));
  };

  const incrementQuantity = (index) => {
    setQuantities((prevQuantities) => ({
      ...prevQuantities,
      [index]: (prevQuantities[index] || 1) + 1,
    }));
  };

  const decrementQuantity = (index) => {
    if (quantities[index] && quantities[index] > 1) {
      setQuantities((prevQuantities) => ({
        ...prevQuantities,
        [index]: prevQuantities[index] - 1,
      }));
    }
  };


  return (
    <div className="bg-white text-black overflow-hidden">
      <div className="block pt-28 pl-5">
        <button
          onClick={() => navigate('/')}
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 mt-6 rounded-full"
        >
          Back
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-lg">
            <div className="mb-2">
              <img
                src={item?.image || 'https://placehold.co/600x500'}
                alt={item?.name || 'Unknown Product'}
                className="w-full h-72 object-cover rounded-lg"
              />
            </div>
            <h3 className="text-lg font-semibold">{item?.name || 'Unknown Product'}</h3>
            <p className="text-gray-500">{item?.category || 'Unknown Category'}</p>
            <p className="text-gray-700 mt-2">Price: Rp. {item?.price || 0}</p>
            <div className="flex justify-between items-center mt-4">
              <div>
                <button
                  onClick={() => handleRent(index)}
                  className="bg-[#1976D2] hover:bg-[#A0E9FF] text-white px-2 py-1 rounded-full mr-2"
                >
                  Rent
                </button>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="bg-red-600 hover:bg-red-800 text-white px-2 py-1 rounded-full"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => decrementQuantity(index)}
                  className="bg-[#1976D2] text-white px-2 py-1 rounded-l hover:bg-[#A0E9FF] transition-colors"
                >
                  -
                </button>
                <input
                  type="text"
                  min="1"
                  value={quantities[index] || 1}
                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                  className="text-black bg-transparent w-10 text-center border-none"
                />
                <button
                  onClick={() => incrementQuantity(index)}
                  className="bg-[#1976D2] text-white px-2 py-1 rounded-r hover-bg-[#A0E9FF] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showCheckoutPopup && selectedItemIndex !== null && items[selectedItemIndex] && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-md shadow-lg text-black">
            <h2 className="text-black text-2xl font-bold mb-4">Rent Camping Order</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Product Name:</p>
                <p className="font-semibold">{items[selectedItemIndex]?.name || 'Unknown Product'}</p>
              </div>
              <div>
                <p className="text-gray-500">Category:</p>
                <p>{items[selectedItemIndex]?.category || 'Unknown Category'}</p>
              </div>
              <div>
                <p className="text-gray-500">Price:</p>
                <p>Rp. {items[selectedItemIndex]?.price || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Delivery Address:</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Rental Start Date:</label>
              <input
                type="date"
                value={rentalStartDate}
                onChange={(e) => setRentalStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="mt-4">
              <label className="text-gray-500">Rental End Date:</label>
              <input
                type="date"
                value={rentalEndDate}
                onChange={(e) => setRentalEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <hr className="my-6 border-gray-300" />
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">Total:</p>
              <p className="text-lg">
                Rp. {items[selectedItemIndex]?.price * (quantities[selectedItemIndex] || 1)}
              </p>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={() => handleConfirmOrder(selectedItemIndex)}
                className="bg-[#1976D2] hover-bg-[#A0E9FF] text-white px-4 py-2 rounded mr-4"
              >
                Confirm Order
              </button>
              <button
                onClick={() => {
                  setShowCheckoutPopup(false);
                  setSelectedItemIndex(null);
                }}
                className="bg-red-700 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
