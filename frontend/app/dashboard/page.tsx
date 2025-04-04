"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Redirect to the appropriate dashboard based on role
    if (role === "Employer") {
      router.push("/dashboard/employer");
    } else if (role === "Job Seeker") {
      router.push("/dashboard/jobseeker");
    } else {
      // If role is not recognized, redirect to login
      router.push("/login");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-black">Redirecting to your dashboard...</p>
    </div>
  );
};

export default Dashboard; 