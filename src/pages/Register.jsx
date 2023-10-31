import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const handleRegister = (e) => {
    e.preventDefault();

    if (!email || !password || password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please enter a valid email and matching passwords!",
      });
      return;
    }

    const user = { email, password };
    localStorage.setItem("user", JSON.stringify(user));

    Swal.fire({
      icon: "success",
      title: "Registration Successful!",
      text: "You can now log in with your credentials.",
      confirmButtonText: "OK",
    }).then((res) => {
      if (res.isConfirmed) {
        navigate("/login");
      }
    });
  };

  return (
    <div className="login-container to-black h-screen flex justify-center items-center">
      <div className="login-form bg-white p-8 rounded-lg shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">User Registration</h1>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email:
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700">
              Confirm Password:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            Register
          </button>
        </form>
        <div className="text-center mt-4">
          Already have an account?{" "}
          <Link className="text-blue-600 hover:underline" to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
