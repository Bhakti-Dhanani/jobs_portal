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

interface FormData {
  title: string;
  description: string;
  salary: string;
  location: string;
  jobType: "full-time" | "part-time" | "contract" | "internship";
  experienceLevel: "entry" | "mid" | "senior" | "lead" | "executive";
  companyName: string;
  expiredAt: string;
  requirements: string;
  industry: string;
}

const initialFormData: FormData = {
  title: "",
  description: "",
  salary: "",
  location: "",
  jobType: "full-time",
  expiredAt: "",
  experienceLevel: "entry",
  companyName: "",
  requirements: "",
  industry: ""
};

const EmployerDashboard = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const jwt = localStorage.getItem('jwt');
      const userData = localStorage.getItem('user');
      const role = localStorage.getItem('role');

      if (!jwt || !userData || role !== 'Employer') {
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

      if (!jwt || !userData || role !== "Employer") {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      console.log('Fetching jobs for user:', user.id);

      if (!user || !user.id) {
        console.error('Invalid user data:', user);
        setError('Invalid user data. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:1337/api/jobs?populate=*&filters[user][id][$eq]=${user.id}`, {
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
      console.log('Raw API response:', JSON.stringify(data, null, 2));
      
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

      console.log('Transformed jobs:', JSON.stringify(transformedJobs, null, 2));
      setJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setCurrentJob(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (job: JobResponse) => {
    setCurrentJob(job);
    setFormData({
      title: job.attributes?.title || "",
      description: job.attributes?.description || "",
      salary: job.attributes?.salary?.toString() || "",
      location: job.attributes?.location || "",
      jobType: job.attributes?.jobType || "full-time",
      expiredAt: job.attributes?.expiredAt || "",
      experienceLevel: job.attributes?.experienceLevel || "entry",
      companyName: job.attributes?.companyName || "",
      requirements: job.attributes?.requirements || "",
      industry: job.attributes?.industry || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const jwt = localStorage.getItem('jwt');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = localStorage.getItem('role');

      if (!jwt || !user || role !== 'Employer') {
        throw new Error('You must be logged in as an employer to create a job');
      }

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Job title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Job description is required');
      }
      if (!formData.location.trim()) {
        throw new Error('Location is required');
      }
      if (!formData.salary.trim()) {
        throw new Error('Salary is required');
      }
      if (!formData.companyName.trim()) {
        throw new Error('Company name is required');
      }

      // Get current date and add 30 days for expiration if not provided
      const expirationDate = formData.expiredAt 
        ? new Date(formData.expiredAt) 
        : new Date(new Date().setDate(new Date().getDate() + 30));

      // Format salary - remove commas and convert to number
      const formattedSalary = parseInt(formData.salary.replace(/,/g, '')) || 0;

      const jobData = {
        data: {
          title: formData.title.trim(),
          description: formData.description.trim(),
          salary: formattedSalary,
          location: formData.location.trim(),
          jobType: formData.jobType,
          expiredAt: expirationDate.toISOString(),
          experienceLevel: formData.experienceLevel,
          companyName: formData.companyName.trim(),
          requirements: formData.requirements.trim(),
          industry: formData.industry.trim(),
          user: user.id,
          publishedAt: new Date().toISOString()
        }
      };
      
      console.log('Submitting job data:', jobData);
      
      const response = await fetch("http://localhost:1337/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify(jobData),
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error?.message || `Failed to create job: ${response.status}`);
      }

      // Clear form and close modal
      setFormData(initialFormData);
      setCurrentJob(null);
      setIsModalOpen(false);
      
      // Refresh jobs list
      await fetchJobs();
    } catch (error) {
      console.error('Error submitting job:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (jobId: number) => {
    try {
      setIsDeleting(true);
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("You must be logged in to delete a job");
      }

      const response = await fetch(`http://localhost:1337/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete job");
      }

      // Remove the deleted job from the local state
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      alert("Job deleted successfully!");
    } catch (err) {
      console.error("Error deleting job:", err);
      setError(err instanceof Error ? err.message : "Failed to delete job");
    } finally {
      setIsDeleting(false);
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
            <h1 className="text-2xl font-bold">Employer Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Jobs</h2>
              <button
                onClick={openCreateModal}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Post New Job
              </button>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600">No jobs posted yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => {
                  const jobData = job.attributes || {};
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
                          <span className="font-medium">Type:</span> {jobData.jobType}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Salary:</span> ${jobData.salary}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Experience:</span> {jobData.experienceLevel}
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
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(job)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                          disabled={isDeleting}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          disabled={isDeleting}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm disabled:opacity-50"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
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

      {/* Job Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {currentJob ? "Edit Job" : "Post New Job"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Type</label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiration Date</label>
                <input
                  type="date"
                  name="expiredAt"
                  value={formData.expiredAt}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead Level</option>
                  <option value="executive">Executive Level</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData(initialFormData);
                    setCurrentJob(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : currentJob ? "Update" : "Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;