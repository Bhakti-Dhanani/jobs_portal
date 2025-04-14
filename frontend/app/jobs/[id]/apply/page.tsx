"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Job {
  id: number;
  attributes: {
    title: string;
    companyName: string;
  };
}

const JobApplicationPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: "",
    resume: null as File | null,
  });

  useEffect(() => {
    // Check if user is logged in and is a jobseeker
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role?.toLowerCase() !== "jobseeker") {
      router.push("/login");
      return;
    }
    
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const jwt = localStorage.getItem("jwt");
      
      const response = await fetch(`http://localhost:1337/api/jobs/${params.id}?populate=*`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      if (!response.ok) {
        console.error(`Error fetching job details: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch job details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Job details:', data);
      setJob(data.data);
    } catch (err: unknown) {
      console.error('Error fetching job details:', err);
      if (err instanceof Error && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setError("Cannot connect to the server. Please make sure the backend server is running.");
      } else {
        setError("Failed to load job details. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverLetterChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      coverLetter: e.target.value,
    });
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("Selected resume file:", file.name, file.type, file.size);
      setFormData({
        ...formData,
        resume: file,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resume) {
      setSubmitError("Please upload your resume");
      return;
    }
    
    if (!formData.coverLetter.trim()) {
      setSubmitError("Please provide a cover letter");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const jwt = localStorage.getItem("jwt");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append the resume file with the correct field name
      if (formData.resume) {
        formDataToSend.append("files.resume", formData.resume);
      }
      
      // Append the application data
      formDataToSend.append("data.coverLetter", formData.coverLetter);
      formDataToSend.append("data.status", "pending");
      formDataToSend.append("data.job", params.id);
      formDataToSend.append("data.applicant", user.id);
      
      console.log("Submitting application with data:", {
        coverLetter: formData.coverLetter,
        status: "pending",
        job: params.id,
        applicant: user.id,
        resume: formData.resume ? formData.resume.name : null
      });
      
      const response = await fetch("http://localhost:1337/api/applications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Extract error message from the response if available
        let errorMessage = `Failed to submit application: ${response.status} ${response.statusText}`;
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
        
        throw new Error(errorMessage);
      }
      
      setSubmitSuccess(true);
      
      // Redirect to job seeker dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/jobseeker");
      }, 2000);
    } catch (err: unknown) {
      console.error('Error submitting application:', err);
      if (err instanceof Error) {
        setSubmitError(err.message || "Failed to submit application. Please try again.");
      } else {
        setSubmitError("Failed to submit application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-lg">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Link href={`/jobs/${params.id}`} className="text-blue-600 hover:underline">
          Back to Job Details
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-lg">Job not found.</p>
        </div>
        <Link href="/jobs" className="text-blue-600 hover:underline">
          Back to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/jobs/${params.id}`} className="text-blue-600 hover:underline">
          &larr; Back to Job Details
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply for {job.attributes.title}</h1>
        <p className="text-xl text-gray-600 mb-8">{job.attributes.companyName}</p>
        
        {submitSuccess ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Application Submitted Successfully!</p>
            <p>You will be redirected to your dashboard shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{submitError}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="resume" className="block text-gray-700 font-medium mb-2">
                Resume (PDF, DOC, DOCX) *
              </label>
              <input
                type="file"
                id="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload your resume in PDF, DOC, or DOCX format (max 5MB)
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="coverLetter" className="block text-gray-700 font-medium mb-2">
                Cover Letter *
              </label>
              <textarea
                id="coverLetter"
                rows={8}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Explain why you're a good fit for this position..."
                value={formData.coverLetter}
                onChange={handleCoverLetterChange}
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium ${
                  isSubmitting
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default JobApplicationPage; 