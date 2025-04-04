"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const Login = () => {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting login with data:', { ...form, password: '[REDACTED]' });
      
      const response = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (response.ok) {
        // Store the JWT token in localStorage
        localStorage.setItem('jwt', data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.role);
        
        alert("Login successful!");
        
        // Redirect to the appropriate dashboard based on role
        if (data.role === "Employer") {
          router.push("/dashboard/employer");
        } else if (data.role === "JobSeeker") {
          router.push("/dashboard/jobseeker");
        } else {
          router.push("/dashboard");
        }
      } else {
        console.error('Login failed:', data);
        alert(data.error?.message || data.message || "Login failed! Check your credentials.");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("An error occurred during login. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Login</h2>
        <input
          type="text"
          name="identifier"
          placeholder="Email or Username"
          value={form.identifier}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3 text-gray-800 placeholder-gray-500"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3 text-gray-800 placeholder-gray-500"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-medium">
          Login
        </button>

        {/* Register Link */}
        <p className="text-center mt-3 text-gray-700">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Register Here
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
