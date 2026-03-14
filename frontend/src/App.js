// =============================================
// Lovely Mens Beauty Parlour — Main App
// =============================================
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/global.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Branches from "./pages/Branches";
import CartPage from "./pages/CartPage";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  // Cart state — shared across the entire app
  const [cart, setCart] = useState([]);

  // Add service to cart
  const addToCart = (service) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === service.id);
      if (exists) return prev; // already in cart
      return [...prev, service];
    });
  };

  // Remove service from cart
  const removeFromCart = (serviceId) => {
    setCart((prev) => prev.filter((item) => item.id !== serviceId));
  };

  // Clear the entire cart
  const clearCart = () => setCart([]);

  return (
    <Router>
      <Navbar cartCount={cart.length} />
      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services addToCart={addToCart} cart={cart} />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
