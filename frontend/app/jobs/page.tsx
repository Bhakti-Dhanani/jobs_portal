"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Job {
  id: number;
  attributes: {
    title: string;
    description: {
      blocks: Array<{
        data: {
          text: string;
        };
      }>;
    };
    requirements: string;
    salary: number;
    location: string;
    jobType: "full-time" | "part-time" | "contract" | "internship";
    experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
    companyName: string;
    industry: string;
    expiredAt: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

const JobsPage = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("all");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role !== "jobseeker") {
      router.push("/login");
      return;
    }
    
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      
      // Get JWT from localStorage if user is logged in
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        router.push("/login");
        return;
      }
      
      const response = await fetch("http://localhost:1337/api/jobs?populate=*", {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          router.push('/login');
          return;
        }
        console.error(`Error fetching jobs: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Jobs data:', data);
      setJobs(data.data || []);
    } catch (err: unknown) {
      console.error('Error fetching jobs:', err);
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError("Cannot connect to the server. Please make sure the backend server is running.");
      } else {
        setError("Failed to load jobs. Please try again later.");
      }
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

  const handleExperienceFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setExperienceLevel(e.target.value);
  };

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleApply = (jobId: number) => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role !== "jobseeker") {
      router.push("/login?redirect=/jobs");
      return;
    }
    
    router.push(`/jobs/${jobId}/apply`);
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchesSearch = job.attributes.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.attributes.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.attributes.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = jobType === "all" || job.attributes.jobType === jobType;
      const matchesExperience = experienceLevel === "all" || job.attributes.experienceLevel === experienceLevel;
      
      return matchesSearch && matchesType && matchesExperience;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.attributes.createdAt).getTime() - new Date(a.attributes.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.attributes.createdAt).getTime() - new Date(b.attributes.createdAt).getTime();
      } else if (sortBy === "salary-high") {
        return b.attributes.salary - a.attributes.salary;
      } else if (sortBy === "salary-low") {
        return a.attributes.salary - b.attributes.salary;
      }
      return 0;
    });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Jobs</h1>
      
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <input
            type="text"
            placeholder="Search jobs, companies, or locations..."
            className="w-full p-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={jobType}
            onChange={handleTypeFilter}
          >
            <option value="all">All Job Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        <div>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={experienceLevel}
            onChange={handleExperienceFilter}
          >
            <option value="all">All Experience Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Showing {filteredJobs.length} of {jobs.length} jobs
        </p>
        <div className="flex items-center">
          <label htmlFor="sort" className="mr-2">Sort by:</label>
          <select
            id="sort"
            className="p-2 border border-gray-300 rounded"
            value={sortBy}
            onChange={handleSort}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="salary-high">Salary (High to Low)</option>
            <option value="salary-low">Salary (Low to High)</option>
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-lg">Loading jobs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg">No jobs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">{job.attributes.title}</h2>
              <p className="text-gray-600 mb-2">{job.attributes.companyName}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {job.attributes.jobType}
                </span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  {job.attributes.experienceLevel}
                </span>
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                  {job.attributes.industry}
                </span>
              </div>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Location:</span> {job.attributes.location}
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-medium">Salary:</span> ${job.attributes.salary.toLocaleString()}
              </p>
              <div className="flex justify-between items-center">
                <Link href={`/jobs/${job.id}`} className="text-blue-600 hover:underline">
                  View Details
                </Link>
                <button
                  onClick={() => handleApply(job.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Apply Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsPage; 