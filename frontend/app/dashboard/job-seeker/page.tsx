"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface JobResponse {
  id: number;
  attributes: {
    title: string;
    description: string;
    salary: number;
    location: string;
    jobType: "full-time" | "part-time" | "contract" | "internship";
    experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
    companyName: string;
    requirements: string;
    industry: string;
    expiredAt: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
  };
}

const JobSeekerDashboard = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const jwt = localStorage.getItem('jwt');
      const userData = localStorage.getItem('user');
      const role = localStorage.getItem('role');

      if (!jwt || !userData || role !== 'JobSeeker') {
        console.log('Authentication failed:', { jwt: !!jwt, userData: !!userData, role });
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return false;
      }

      try {
        const user = JSON.parse(userData);
        if (!user || !user.id) {
          console.log('Invalid user data');
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          window.location.href = '/login';
          return false;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return false;
      }

      return true;
    };

    if (checkAuth()) {
      fetchJobs();
    }
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const jwt = localStorage.getItem("jwt");
      const userData = localStorage.getItem("user");
      const role = localStorage.getItem("role");

      if (!jwt || !userData || role !== "JobSeeker") {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:1337/api/jobs?populate=*`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("jwt");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          router.push("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API Response:', JSON.stringify(data, null, 2));
      
      if (!data.data || !Array.isArray(data.data)) {
        console.error('Invalid data structure:', data);
        setError("Invalid data received from server");
        return;
      }

      const transformedJobs = data.data.map((job: any) => {
        console.log('Processing job:', JSON.stringify(job, null, 2));
        
        if (!job.attributes) {
          console.error('Job missing attributes:', job);
          return null;
        }

        const attributes = job.attributes;
        console.log('Job attributes:', JSON.stringify(attributes, null, 2));

        if (!attributes.title || !attributes.description || !attributes.salary) {
          console.error('Job missing required fields:', attributes);
          return null;
        }

        return {
          id: job.id,
          attributes: {
            title: attributes.title,
            description: attributes.description,
            salary: attributes.salary,
            location: attributes.location,
            jobType: attributes.jobType,
            experienceLevel: attributes.experienceLevel,
            companyName: attributes.companyName,
            requirements: attributes.requirements,
            industry: attributes.industry,
            expiredAt: attributes.expiredAt,
            publishedAt: attributes.publishedAt,
            createdAt: attributes.createdAt,
            updatedAt: attributes.updatedAt
          }
        };
      }).filter(Boolean);

      console.log('Final transformed jobs:', JSON.stringify(transformedJobs, null, 2));
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
      const userData = localStorage.getItem("user");
      
      if (!jwt || !userData) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch("http://localhost:1337/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            job: jobId,
            user: user.id,
            status: "pending",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply for job");
      }

      alert("Application submitted successfully!");
    } catch (error) {
      console.error("Error applying for job:", error);
      alert("Failed to apply for job. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No jobs available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => {
                  const jobData = job.attributes;
                  return (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {jobData.title}
                      </h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">Company:</span> {jobData.companyName}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Location:</span> {jobData.location}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Type:</span> {jobData.jobType.charAt(0).toUpperCase() + jobData.jobType.slice(1)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Salary:</span> ${jobData.salary.toLocaleString()}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Experience:</span> {jobData.experienceLevel.charAt(0).toUpperCase() + jobData.experienceLevel.slice(1)}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Posted:</span> {new Date(jobData.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-1">Description:</h4>
                        <p className="text-gray-600 text-sm">
                          {jobData.description}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleApply(job.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard; 