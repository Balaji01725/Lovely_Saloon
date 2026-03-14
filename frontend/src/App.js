import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./styles/global.css";

import Navbar         from "./components/Navbar";
import Footer         from "./components/Footer";
import Home           from "./pages/Home";
import About          from "./pages/About";
import Services       from "./pages/Services";
import Branches       from "./pages/Branches";
import CartPage       from "./pages/CartPage";
import Contact        from "./pages/Contact";
import LoginPage      from "./pages/LoginPage";
import UserDashboard  from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [cart,      setCart]      = useState([]);
  const [userPhone, setUserPhone] = useState(localStorage.getItem("lmbp_phone")    || "");
  const [userRole,  setUserRole]  = useState(localStorage.getItem("lmbp_role")     || "");
  const [loggedIn,  setLoggedIn]  = useState(localStorage.getItem("lmbp_loggedIn") === "true");

  useEffect(() => {
    const phone = localStorage.getItem("lmbp_phone");
    const role  = localStorage.getItem("lmbp_role");
    const li    = localStorage.getItem("lmbp_loggedIn") === "true";
    if (phone && li) { setUserPhone(phone); setUserRole(role); setLoggedIn(true); }
  }, []);

  const handleLogin = (phone, role) => {
    localStorage.setItem("lmbp_phone",    phone);
    localStorage.setItem("lmbp_role",     role);
    localStorage.setItem("lmbp_loggedIn", "true");
    setUserPhone(phone);
    setUserRole(role);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("lmbp_phone");
    localStorage.removeItem("lmbp_role");
    localStorage.removeItem("lmbp_loggedIn");
    setUserPhone(""); setUserRole(""); setLoggedIn(false);
  };

  const addToCart      = (s)  => setCart((p) => p.find((i) => i.id === s.id) ? p : [...p, s]);
  const removeFromCart = (id) => setCart((p) => p.filter((i) => i.id !== id));
  const clearCart      = ()   => setCart([]);

  const RequireAuth  = ({ children }) => !loggedIn ? <Navigate to="/login" replace /> : children;
  const RequireAdmin = ({ children }) => (!loggedIn || userRole !== "admin") ? <Navigate to="/login" replace /> : children;

  return (
    <Router>
      <Navbar
        cartCount={cart.length}
        loggedIn={loggedIn}
        userPhone={userPhone}
        userRole={userRole}
        onLogout={handleLogout}
      />
      <Routes>
        <Route path="/"         element={<Home     addToCart={addToCart} />} />
        <Route path="/about"    element={<About />} />
        <Route path="/services" element={<Services addToCart={addToCart} cart={cart} />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/contact"  element={<Contact />} />

        <Route path="/login" element={
          loggedIn
            ? <Navigate to={userRole === "admin" ? "/admin/dashboard" : "/dashboard"} replace />
            : <LoginPage onLogin={handleLogin} />
        } />

        <Route path="/cart" element={
          <RequireAuth>
            <CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} userPhone={userPhone} />
          </RequireAuth>
        } />

        <Route path="/dashboard" element={
          <RequireAuth>
            <UserDashboard userPhone={userPhone} onLogout={handleLogout} />
          </RequireAuth>
        } />

        <Route path="/admin/dashboard" element={
          <RequireAdmin>
            <AdminDashboard onLogout={handleLogout} />
          </RequireAdmin>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer loggedIn={loggedIn} userRole={userRole} />
    </Router>
  );
}

export default App;
