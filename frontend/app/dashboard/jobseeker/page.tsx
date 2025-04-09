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

interface Application {
  id: number;
  coverLetter?: string;
  createdAt: string;
  status: string;
  job: {
    data: {
      id: number;
      attributes: {
        title: string;
        companyName: string;
        expiredAt?: string;
      };
    } | null;
  } | null;
  applicant: {
    id: number;
    username: string;
    email: string;
  } | null;
  resume: {
    data: {
      id: number;
      attributes: {
        url: string;
        name: string;
      };
    } | null;
  } | null;
}

export default function JobSeekerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobResponse | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  const [userApplications, setUserApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'applied'>('available');

  // State for Update Resume Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedApplicationForUpdate, setSelectedApplicationForUpdate] = useState<Application | null>(null);
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    const jwt = localStorage.getItem("jwt");
    console.log('Initial Auth Check:', { jwt: !!jwt, userData: userData ? JSON.parse(userData) : null, role });

    fetchJobs();

    const interval = setInterval(() => {
      fetchJobs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'applied') {
      fetchAppliedJobs();
    }
  }, [activeTab]);

  const fetchAppliedJobs = async () => {
    try {
      setError(null);
      const jwt = localStorage.getItem("jwt");
      const userData = localStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
  
      if (!jwt || !user || !user.id) {
        throw new Error("Authentication required to fetch applied jobs");
      }
  
      console.log('fetchAppliedJobs - Auth check:', { jwt: !!jwt, userData: !!userData, role: user.role?.name });
  
      const response = await fetch(
        "http://localhost:1337/api/applications?populate[job][fields][0]=title&populate[job][fields][1]=companyName&populate[job][fields][2]=expiredAt&populate[applicant][fields][0]=id&populate[applicant][fields][1]=username&populate[applicant][fields][2]=email&populate[resume][fields][0]=id&populate[resume][fields][1]=url&populate[resume][fields][2]=name",
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('fetchAppliedJobs - Error response:', errorData);
        throw new Error(`Failed to fetch applied jobs: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
  
      const rawData = await response.json();
      console.log('fetchAppliedJobs - Raw response:', JSON.stringify(rawData, null, 2)); // Debug full response
  
      const { data }: { data: Application[] } = rawData;
      setUserApplications(data);
      console.log('fetchAppliedJobs - Set userApplications:', data);
  
      const appliedJobIds = data
        .filter(app => app.job?.data?.id != null)
        .map(app => app.job!.data!.id);
      setAppliedJobs(appliedJobIds);
      console.log('fetchAppliedJobs - Set appliedJobs:', appliedJobIds);
    } catch (err) {
      console.error('Error fetching applied jobs:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch applied jobs");
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const jwt = localStorage.getItem("jwt");
      const userData = localStorage.getItem("user");
      const role = localStorage.getItem("role");

      console.log('fetchJobs - Auth check:', { jwt: !!jwt, userData: !!userData, role });

      if (!jwt || !userData) {
        console.log('Missing auth data, redirecting to login');
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        router.push("/login");
        return;
      }

      const user = JSON.parse(userData);
      console.log('fetchJobs - User data:', user);

      const response = await fetch("http://localhost:1337/api/jobs?populate=*", {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("fetchJobs - Error response:", errorData);
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
      console.log("fetchJobs - Raw jobs data:", data);

      if (!data.data || !Array.isArray(data.data)) {
        setError("Invalid data received from server");
        return;
      }

      const transformedJobs = data.data.map((job: any) => {
        if (job.attributes) {
          return { id: job.id, attributes: job.attributes };
        }
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

      console.log("fetchJobs - Transformed jobs:", transformedJobs);
      setJobs(transformedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (job: JobResponse) => {
    if (appliedJobs.includes(job.id)) {
      alert("You have already applied for this job.");
      return;
    }
    setSelectedJob(job);
    setIsApplicationModalOpen(true);
  };

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const jwt = localStorage.getItem("jwt");
      const userData = localStorage.getItem("user");
      console.log('handleSubmitApplication - JWT:', !!jwt);
      console.log('handleSubmitApplication - User Data:', userData ? JSON.parse(userData) : null);

      if (!jwt) {
        throw new Error("You must be logged in to apply for a job");
      }

      if (!selectedJob || !selectedJob.id || !resumeFile) {
        throw new Error("Please select a job and upload a resume");
      }

      if (appliedJobs.includes(selectedJob.id)) {
        throw new Error("You have already applied for this job");
      }

      const user = userData ? JSON.parse(userData) : null;
      if (!user || !user.id) {
        throw new Error("User data is missing or invalid");
      }

      console.log('STEP 1: Attempting multipart/form-data request...');
      const formData = new FormData();
      formData.append('files.resume', resumeFile);
      const applicationData = {
        job: selectedJob.id,
        applicant: user.id,
        status: "pending",
        coverLetter: coverLetter || "",
      };
      formData.append('data', JSON.stringify(applicationData));

      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value instanceof File ? `[File: ${value.name}, Type: ${value.type}]` : value}`);
      }

      const response = await fetch("http://localhost:1337/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Response:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error?.message || `Failed to apply for job: ${response.status}`);
      }

      const data = await response.json();
      console.log('Success response:', data);

      // Immediately update applied jobs list and fetch full list if needed
      setAppliedJobs(prev => [...prev, selectedJob.id]);
      if (activeTab === 'applied') {
        await fetchAppliedJobs(); // Refresh the list
      }

      alert("Application submitted successfully!");
      setIsApplicationModalOpen(false);
      setCoverLetter("");
      setResumeFile(null);
      setSelectedJob(null);
    } catch (err) {
      console.error("Error applying for job:", err);
      setError(err instanceof Error ? err.message : "Failed to apply for job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async (applicationId: number) => {
    if (!window.confirm("Are you sure you want to delete this application?")) {
      return;
    }
    try {
      setError(null);
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("Authentication required to delete application");
      }

      const response = await fetch(`http://localhost:1337/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to delete application: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      alert("Application deleted successfully!");
      // Refresh the list
      await fetchAppliedJobs();

    } catch (err) {
      console.error('Error deleting application:', err);
      setError(err instanceof Error ? err.message : "Failed to delete application");
    }
  };

  const handleOpenUpdateModal = (application: Application) => {
    setSelectedApplicationForUpdate(application);
    setNewResumeFile(null); // Clear previous file selection
    setIsUpdateModalOpen(true);
    setError(null);
  };

  const handleUpdateResume = async () => {
    if (!selectedApplicationForUpdate || !newResumeFile) {
      setError("Please select a resume file to update.");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("Authentication required to update resume");
      }

      const formData = new FormData();
      formData.append('files.resume', newResumeFile);
      // We only need to send the file for update, Strapi handles the relation
      // If other fields needed updating, add a 'data' field like in POST

      const response = await fetch(`http://localhost:1337/api/applications/${selectedApplicationForUpdate.id}`, {
        method: 'PUT', // Or POST if your backend expects that for file updates on existing entries
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update Resume Error Response:', errorData);
        throw new Error(`Failed to update resume: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      alert("Resume updated successfully!");
      setIsUpdateModalOpen(false);
      setSelectedApplicationForUpdate(null);
      setNewResumeFile(null);
      await fetchAppliedJobs(); // Refresh the list

    } catch (err) {
      console.error('Error updating resume:', err);
      setError(err instanceof Error ? err.message : "Failed to update resume");
    } finally {
      setIsUpdating(false);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && jobs.length === 0 && userApplications.length === 0) {
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

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
            <button
              onClick={() => {
                localStorage.removeItem("jwt");
                localStorage.removeItem("user");
                localStorage.removeItem("role");
                router.push("/login");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('available')}
                className={`${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Available Jobs
              </button>
              <button
                onClick={() => setActiveTab('applied')}
                className={`${
                  activeTab === 'applied'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                My Applications
              </button>
            </nav>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {activeTab === 'available' ? (
            <>
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Job Types</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading jobs...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">No jobs found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {job.attributes.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Company:</span> {job.attributes.companyName}</p>
                          <p><span className="font-medium">Location:</span> {job.attributes.location}</p>
                          <p><span className="font-medium">Type:</span> {job.attributes.jobType}</p>
                          <p><span className="font-medium">Salary:</span> ${job.attributes.salary?.toLocaleString() ?? 'N/A'}</p>
                          <p><span className="font-medium">Experience:</span> {job.attributes.experienceLevel}</p>
                        </div>
                        <div className="mt-3">
                          <h4 className="font-medium text-gray-700 text-sm mb-1">Description:</h4>
                          <p className="text-gray-600 text-sm line-clamp-3">
                            {job.attributes.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleApply(job)}
                          disabled={appliedJobs.includes(job.id)}
                          className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors duration-150 ${ appliedJobs.includes(job.id) ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700" }`}
                        >
                          {appliedJobs.includes(job.id) ? "Already Applied" : "Apply Now"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Applications</h2>
              {isLoading && userApplications.length === 0 ? (
                <div className="text-center py-8">Loading applications...</div>
              ) : userApplications.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">You haven't applied for any jobs yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userApplications.map((application) => {
                    console.log(`Rendering Application ID: ${application.id}, Job Data:`, application.job);

                    const jobAttributes = application.job?.data?.attributes;

                    return (
                      <div key={application.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-grow space-y-1 text-sm">
                            <h3 className="text-base font-semibold text-gray-800">
                              {jobAttributes?.title || "Job Title Missing"}
                            </h3>
                            <p className="text-gray-600">
                              <span className="font-medium">Company:</span> {jobAttributes?.companyName || "Unknown"}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Applied on:</span> {formatDate(application.createdAt)}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Job Expires on:</span> {formatDate(jobAttributes?.expiredAt)}
                            </p>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {application.resume?.data?.attributes.url ? (
                              <a
                                href={`http://localhost:1337${application.resume.data.attributes.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150"
                              >
                                View Resume
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">No Resume</span>
                            )}
                          </div>
                        </div>
                        {application.coverLetter && (
                          <div className="mt-4 pt-3 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-1 text-sm">Cover Letter:</h4>
                            <p className="text-gray-600 text-sm">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => handleOpenUpdateModal(application)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            title="Update Resume"
                          >
                            Update Resume
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteApplication(application.id)}
                            className="px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 rounded-md text-xs font-medium hover:bg-red-100 transition-colors duration-150"
                            title="Delete Application"
                          >
                            Delete Application
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isApplicationModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Apply for {selectedJob.attributes.title}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitApplication(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter (Optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Introduce yourself and explain why you're a good fit for this position..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsApplicationModalOpen(false);
                    setSelectedJob(null);
                    setCoverLetter("");
                    setResumeFile(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
                  disabled={isSubmitting || !resumeFile}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUpdateModalOpen && selectedApplicationForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Update Resume for {selectedApplicationForUpdate.job?.data?.attributes.title || 'Application'}</h2>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateResume(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Resume (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setNewResumeFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsUpdateModalOpen(false);
                    setSelectedApplicationForUpdate(null);
                    setNewResumeFile(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-150 disabled:opacity-50"
                  disabled={isUpdating || !newResumeFile}
                >
                  {isUpdating ? "Updating..." : "Update Resume"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}