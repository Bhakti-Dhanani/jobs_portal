"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobResponse } from "@/types/job";

export default function JobSeekerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");

  useEffect(() => {
    fetchJobs();
    
    // Refresh jobs every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const jwt = localStorage.getItem("jwt");
      const userData = localStorage.getItem("user");
      const role = localStorage.getItem("role");

      console.log('Auth check:', { jwt: !!jwt, userData: !!userData, role });

      // Only redirect if there's no JWT or user data
      if (!jwt || !userData) {
        console.log('Missing auth data, redirecting to login');
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData);
      console.log('User data:', user);

      // Don't redirect based on role, just fetch jobs
      const response = await fetch("http://localhost:1337/api/jobs?populate=*", {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        
        if (response.status === 401) {
          console.log('Unauthorized, clearing auth data');
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          router.push("/login");
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw jobs data:", data);
      
      if (!data.data || !Array.isArray(data.data)) {
        setError("Invalid data received from server");
        return;
      }

      // Transform the jobs data
      const transformedJobs = data.data.map((job: any) => {
        // If the job data is already in the correct format, return it as is
        if (job.attributes) {
          return {
            id: job.id,
            attributes: job.attributes
          };
        }
        
        // If the job data is flat, transform it into the expected format
        return {
          id: job.id,
          attributes: {
            title: job.title,
            description: job.description,
            salary: job.salary,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            companyName: job.companyName,
            requirements: job.requirements,
            industry: job.industry,
            expiredAt: job.expiredAt,
            publishedAt: job.publishedAt,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt
          }
        };
      });
      
      console.log("Transformed jobs:", transformedJobs);
      setJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("You must be logged in to apply for a job");
      }

      const response = await fetch("http://localhost:1337/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            job: jobId,
            status: "pending",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to apply for job");
      }

      alert("Application submitted successfully!");
    } catch (err) {
      console.error("Error applying for job:", err);
      setError(err instanceof Error ? err.message : "Failed to apply for job");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.attributes.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.attributes.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.attributes.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobType = !selectedJobType || job.attributes.jobType === selectedJobType;

    return matchesSearch && matchesJobType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Jobs</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              id="jobSearch"
              name="jobSearch"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <select
              id="jobTypeFilter"
              name="jobTypeFilter"
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {job.attributes?.title || "Untitled Job"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {job.attributes?.companyName || "Company not specified"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {job.attributes?.location || "Location not specified"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {job.attributes?.jobType ? (
                    job.attributes.jobType === "full-time"
                      ? "Full-time"
                      : job.attributes.jobType === "part-time"
                      ? "Part-time"
                      : job.attributes.jobType === "contract"
                      ? "Contract"
                      : job.attributes.jobType === "internship"
                      ? "Internship"
                      : job.attributes.jobType
                  ) : "Type not specified"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  ${job.attributes?.salary || 0}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  {job.attributes?.description || "No description available"}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => handleApply(job.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No jobs found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
} 