import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header'; 
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import ChatBot from './pages/ChatBot';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Cart from './pages/Cart';



const App = () => {
  return (
    <BrowserRouter>
      <Header /> 
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productdetail/:id" element={<ProductDetails />} />
        <Route path="/chat" element={<ChatBot />} />
        <Route path="/admin/" element={<Admin />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/Register" element={<Register/>} />
        <Route path="/Contact" element={<Contact/>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
