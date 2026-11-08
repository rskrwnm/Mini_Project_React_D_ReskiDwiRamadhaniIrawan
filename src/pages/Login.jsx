import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api, { getErrorMessage } from "../api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Email and password are required!",
      });
      return;
    }

    try {
      const { data } = await api.post("/auth/login", { email, password });
      const isAdmin = data.user.role === "admin";

      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", true);
      localStorage.setItem("user", JSON.stringify(data.user));

      Swal.fire({
        icon: "success",
        title: isAdmin ? "Admin Successfully Logged In!" : "Successfully Logged In!",
        confirmButtonText: "OK",
      }).then((res) => {
        if (res.isConfirmed) {
          navigate(isAdmin ? "/admin" : "/");
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: getErrorMessage(error, "Login failed. Please try again."),
      });
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <form onSubmit={handleLogin}>
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
          <div className="mb-6">
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
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
          >
            Login
          </button>
        </form>
        <div className="text-center mt-4">
          Don't have an account?{" "}
          <Link className="text-blue-600 hover:underline" to="/Register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
