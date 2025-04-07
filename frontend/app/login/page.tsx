"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const Login = () => {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Authenticate user
      console.log('Attempting to authenticate user...');
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });

      const data = await response.json();
      console.log('Auth response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Store the JWT token
      localStorage.setItem('jwt', data.jwt);
      console.log('JWT token stored');
      
      // If user data is in the response, use it directly
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.user.role?.name || '');
        
        // Redirect based on role
        if (data.user.role?.name === 'Employer') {
          router.push('/dashboard/employer');
        } else if (data.user.role?.name === 'JobSeeker') {
          router.push('/dashboard/jobseeker');
        } else {
          router.push('/');
        }
        return;
      }
      
      // If no user data, try to fetch it
      console.log('Fetching user data...');
      const userResponse = await fetch('http://localhost:1337/api/users/me?populate=role', {
        headers: {
          'Authorization': `Bearer ${data.jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        // If we can't get user data, still proceed with the JWT token
        console.warn('Could not fetch user data, proceeding with limited information');
        router.push('/');
        return;
      }

      const userData = await userResponse.json();
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role?.name || '');
      
      // Redirect based on role
      if (userData.role?.name === 'Employer') {
        router.push('/dashboard/employer');
      } else if (userData.role?.name === 'JobSeeker') {
        router.push('/dashboard/jobseeker');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Login</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 border border-red-300 rounded">
            {error}
          </div>
        )}
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
        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
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
