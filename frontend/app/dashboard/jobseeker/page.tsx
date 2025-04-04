"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  type: string;
  createdAt: string;
}

const JobSeekerDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("all");
  const router = useRouter();

  // Check if user is logged in and is a job seeker
  useEffect(() => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role !== "JobSeeker") {
      router.push("/login");
      return;
    }
    
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const jwt = localStorage.getItem("jwt");
      
      const response = await fetch("http://localhost:1337/api/job?populate=*", {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      
      const data = await response.json();
      setJobs(data.data || []);
    } catch (err) {
      setError("Failed to load jobs. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setJobType(e.target.value);
  };

  const handleApply = async (jobId: number) => {
    try {
      const jwt = localStorage.getItem("jwt");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      const applicationData = {
        data: {
          job: jobId,
          applicant: user.id,
          status: "Pending",
        },
      };
      
      const response = await fetch("http://localhost:1337/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(applicationData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit application");
      }
      
      alert("Application submitted successfully!");
    } catch (err) {
      setError("Failed to submit application. Please try again.");
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  };

  // Filter jobs based on search term and job type
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = jobType === "all" || job.type === jobType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Job Seeker Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </nav>
      
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Jobs</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search jobs by title, company, or location..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={jobType}
                onChange={handleTypeFilter}
                className="w-full p-2 border rounded"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-8">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No jobs found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                <p className="text-gray-600">{job.company}</p>
                <p className="text-gray-500 text-sm">{job.location}</p>
                <p className="text-gray-500 text-sm">{job.type} • {job.salary}</p>
                <p className="text-gray-700 mt-2 line-clamp-3">{job.description}</p>
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={() => handleApply(job.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSeekerDashboard; 