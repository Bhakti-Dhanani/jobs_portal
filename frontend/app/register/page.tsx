"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const Register = () => {
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const router = useRouter();

  const handleRoleSelection = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting registration with data:', { ...form, role });
      
      const response = await fetch("http://localhost:1337/api/auth/local/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok) {
        alert("Registration successful!");
        router.push("/login");
      } else {
        console.error('Registration failed:', data);
        alert(data.error?.message || data.message || "Registration failed!");
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert("An error occurred during registration. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        {!role ? (
          <>
            <h2 className="text-xl font-bold mb-4 text-center text-black">Select Role</h2>
            <div className="flex justify-between">
              <button
                onClick={() => handleRoleSelection("Employer")}
                className="w-1/2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mr-2"
              >
                Employer
              </button>
              <button
                onClick={() => handleRoleSelection("Job Seeker")}
                className="w-1/2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                Job Seeker
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4 text-center text-black">Register as {role}</h2>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full p-2 border rounded mb-3"
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Register
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Register;
