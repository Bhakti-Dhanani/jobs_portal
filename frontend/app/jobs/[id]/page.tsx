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

const JobDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role !== "jobseeker") {
      router.push("/login");
      return;
    }
    
    fetchJobDetails();
  }, []);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      
      // Get JWT from localStorage if user is logged in
      const jwt = localStorage.getItem("jwt");
      const headers: HeadersInit = {};
      
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }
      
      const response = await fetch(`http://localhost:1337/api/jobs/${params.id}?populate=*`, {
        headers,
      });
      
      if (!response.ok) {
        console.error(`Error fetching job details: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to fetch job details: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Job details:', data);
      setJob(data.data);
    } catch (err: any) {
      setError("Failed to fetch job details");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");
    
    if (!user || role !== "jobseeker") {
      router.push(`/login?redirect=/jobs/${params.id}/apply`);
      return;
    }
    
    router.push(`/jobs/${params.id}/apply`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <Link href="/jobs" className="text-blue-600 hover:underline">
          Back to Jobs
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

  const daysRemaining = getDaysRemaining(job.attributes.expiredAt);
  const isExpired = daysRemaining < 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/jobs" className="text-blue-600 hover:underline">
          &larr; Back to Jobs
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{job.attributes.title}</h1>
            <p className="text-xl text-gray-600 mb-4">{job.attributes.companyName}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                {job.attributes.jobType}
              </span>
              <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded">
                {job.attributes.experienceLevel}
              </span>
              <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded">
                {job.attributes.industry}
              </span>
              {isExpired ? (
                <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded">
                  Expired
                </span>
              ) : (
                <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded">
                  {daysRemaining} days remaining
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleApply}
              disabled={isExpired}
              className={`px-6 py-3 rounded-lg font-medium ${
                isExpired
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isExpired ? "Application Closed" : "Apply Now"}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Location</h3>
            <p>{job.attributes.location}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Salary</h3>
            <p>${job.attributes.salary.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Posted On</h3>
            <p>{formatDate(job.attributes.createdAt)}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Job Description</h2>
          <div className="prose max-w-none">
            {job.attributes.description.blocks.map((block, index) => (
              <p key={index}>{block.data.text}</p>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Requirements</h2>
          <div className="prose max-w-none">
            <p>{job.attributes.requirements}</p>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">About {job.attributes.companyName}</h2>
          <p className="text-gray-600">
            {job.attributes.companyName} is a company in the {job.attributes.industry} industry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage; 