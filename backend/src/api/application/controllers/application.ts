// /**
//  * application controller
//  */

// import { factories } from '@strapi/strapi'
// import { Context } from 'koa'
// import { errors } from '@strapi/utils'



// // Define the Application interface based on the schema
// interface ApplicationData {
//   status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
//   job: number;
//   applicant: number;
//   coverLetter: string;
//   resume: number;
// }

// // Define the query interface
// interface QueryFilters {
//   job?: number;
//   applicant?: number;
//   [key: string]: any;
// }

// interface Query {
//   filters?: QueryFilters;
//   [key: string]: any;
// }

// // Define the Strapi entity structure
// interface StrapiEntity<T> {
//   id: number;
//   attributes: T;
// }

// interface ApplicationAttributes {
//   resume: any;
//   coverLetter: string;
//   status: string;
//   job: {
//     data: {
//       id: number;
//       attributes: any;
//     };
//   };
//   applicant: {
//     data: {
//       id: number;
//       attributes: any;
//     };
//   };
//   createdAt: string;
//   updatedAt: string;
//   publishedAt: string;
// }

// interface ApplicationEntity {
//   id: number;
//   attributes: {
//     status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
//     coverLetter: string;
//     resume: number;
//     createdAt: string;
//     updatedAt: string;
//     publishedAt: string;
//     job: {
//       data: {
//         id: number;
//         attributes: {
//           user: {
//             data: {
//               id: number;
//             };
//           };
//         };
//       };
//     };
//     applicant: {
//       data: {
//         id: number;
//       };
//     };
//   };
// }

// // Use type assertion to fix the TypeScript error
// export default factories.createCoreController('api::application.application', ({ strapi }) => ({
//   async find(ctx: any) {
//     try {
//       const { user } = ctx.state;
      
//       if (!user) {
//         return ctx.unauthorized('You must be logged in to view applications');
//       }

//       // Use type assertion to bypass TypeScript errors
//       const queryOptions: any = {
//         populate: {
//           job: {
//             populate: ['user']
//           },
//           applicant: true,
//           resume: true
//         }
//       };

//       if (user.role.name === 'Job Seeker') {
//         queryOptions.filters = { applicant: { id: user.id } };
//       } else if (user.role.name === 'Employer') {
//         queryOptions.filters = { job: { user: { id: user.id } } };
//       }

//       const applications = await strapi.entityService.findMany('api::application.application', queryOptions);

//       return { data: applications };
//     } catch (err) {
//       console.error('Error in find:', err);
//       return ctx.internalServerError('An error occurred while fetching applications');
//     }
//   },

//   async findOne(ctx: any) {
//     try {
//       const { id } = ctx.params;
//       const { user } = ctx.state;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to view applications');
//       }

//       const application = await strapi.entityService.findOne('api::application.application', id, {
//         populate: {
//           job: {
//             populate: ['user']
//           },
//           applicant: true
//         }
//       }) as unknown as ApplicationEntity;

//       if (!application) {
//         return ctx.notFound('Application not found');
//       }

//       // Only allow users to view their own applications or employers to view applications for their jobs
//       if (
//         (user.role === 'jobseeker' && application.attributes.applicant.data.id !== user.id) ||
//         (user.role === 'employer' && application.attributes.job.data.attributes.user.data.id !== user.id) ||
//         (user.role !== 'jobseeker' && user.role !== 'employer' && user.role !== 'admin')
//       ) {
//         return ctx.forbidden('You do not have permission to view this application');
//       }

//       return { data: application };
//     } catch (err) {
//       console.error('Error in findOne:', err);
//       return ctx.internalServerError('An error occurred while fetching the application');
//     }
//   },

//   async create(ctx: any) {
//     try {
//       const { user } = ctx.state;
      
//       if (!user) {
//         return ctx.unauthorized('You must be logged in to submit applications');
//       }

//       // Check if user is a job seeker (case-insensitive and handle both formats)
//       const userRole = user.role.name.toLowerCase();
//       if (userRole !== 'job seeker' && userRole !== 'jobseeker') {
//         return ctx.forbidden('Only job seekers can submit applications');
//       }

//       // Extract data from FormData
//       console.log('Request body:', ctx.request.body);
//       console.log('Request body keys:', Object.keys(ctx.request.body));
      
//       // Parse the data from the request body
//       let jobIdStr = null;
      
//       // Try different ways to access the job ID
//       if (ctx.request.body.data?.job) {
//         jobIdStr = ctx.request.body.data.job;
//       } else if (ctx.request.body['data[job]']) {
//         jobIdStr = ctx.request.body['data[job]'];
//       } else if (ctx.request.body.data && typeof ctx.request.body.data === 'object') {
//         // Try to find the job ID in the data object
//         for (const key in ctx.request.body.data) {
//           if (key.includes('job')) {
//             jobIdStr = ctx.request.body.data[key];
//             break;
//           }
//         }
//       }
      
//       console.log('Job ID string:', jobIdStr);
      
//       if (!jobIdStr) {
//         return ctx.badRequest('Job ID is required');
//       }
      
//       const jobId = parseInt(jobIdStr, 10);
//       if (isNaN(jobId)) {
//         return ctx.badRequest('Invalid job ID');
//       }
      
//       console.log('Job ID:', jobId);
      
//       const job = await strapi.entityService.findOne('api::job.job', jobId, {
//         populate: ['user']
//       });

//       if (!job) {
//         return ctx.notFound('Job not found');
//       }

//       // Check if already applied
//       const existingApplications = await strapi.entityService.findMany('api::application.application', {
//         filters: {
//           job: { id: jobId },
//           applicant: { id: user.id }
//         }
//       });

//       if (existingApplications.length > 0) {
//         return ctx.badRequest('You have already applied for this job');
//       }

//       // Handle file upload
//       const { files } = ctx.request;
//       let resumeId = null;

//       console.log('Files received:', files);
//       console.log('Files type:', typeof files);
//       console.log('Files keys:', files ? Object.keys(files) : 'No files');
      
//       // Check for resume file in different possible locations
//       const resumeFile = files?.resume || files?.['files.resume'] || files?.['files[resume]'];
//       console.log('Resume file found:', resumeFile ? 'Yes' : 'No');
//       if (resumeFile) {
//         console.log('Resume file details:', {
//           name: resumeFile.name,
//           type: resumeFile.type,
//           size: resumeFile.size
//         });
//       }
      
//       if (resumeFile) {
//         try {
//           console.log('Uploading resume file:', resumeFile);
          
//           // Ensure the file is in the correct format
//           if (!resumeFile.type || (!resumeFile.type.includes('pdf') && !resumeFile.type.includes('doc') && !resumeFile.type.includes('docx'))) {
//             console.warn('File type not supported:', resumeFile.type);
//             return ctx.badRequest('Unsupported file type. Please upload a PDF, DOC, or DOCX file.');
//           }
          
//           const uploadedFile = await strapi.plugins.upload.services.upload.upload({
//             data: {},
//             files: resumeFile,
//           });
//           console.log('File upload result:', uploadedFile);
          
//           if (uploadedFile && uploadedFile.length > 0 && uploadedFile[0].id) {
//             resumeId = uploadedFile[0].id;
//             console.log('Resume file uploaded successfully with ID:', resumeId);
//           } else {
//             console.error('File upload failed: No file ID returned');
//             return ctx.badRequest('Failed to upload resume file: No file ID returned');
//           }
//         } catch (uploadError) {
//           console.error('Error uploading file:', uploadError);
//           return ctx.badRequest('Failed to upload resume file');
//         }
//       } else {
//         console.log('No resume file provided');
//         return ctx.badRequest('Resume file is required');
//       }

//       console.log('Creating application with data:', {
//         ...ctx.request.body.data,
//         applicant: user.id,
//         status: 'pending',
//         coverLetter: '',
//         resume: resumeId
//       });
      
//       // Extract data from FormData
//       const applicationData = {
//         job: jobId,
//         applicant: user.id,
//         status: 'pending' as 'pending' | 'reviewed' | 'accepted' | 'rejected',
//         coverLetter: '',
//         resume: resumeId
//       };
      
//       // Try to get the cover letter from the request body
//       if (ctx.request.body.data?.coverLetter) {
//         applicationData.coverLetter = ctx.request.body.data.coverLetter;
//       } else if (ctx.request.body['data[coverLetter]']) {
//         applicationData.coverLetter = ctx.request.body['data[coverLetter]'];
//       } else if (ctx.request.body.data && typeof ctx.request.body.data === 'object') {
//         // Try to find the cover letter in the data object
//         for (const key in ctx.request.body.data) {
//           if (key.includes('coverLetter')) {
//             applicationData.coverLetter = ctx.request.body.data[key];
//             break;
//           }
//         }
//       }
      
//       // Try to get the status from the request body
//       if (ctx.request.body.data?.status) {
//         const status = ctx.request.body.data.status;
//         if (status === 'pending' || status === 'reviewed' || status === 'accepted' || status === 'rejected') {
//           applicationData.status = status;
//         }
//       } else if (ctx.request.body['data[status]']) {
//         const status = ctx.request.body['data[status]'];
//         if (status === 'pending' || status === 'reviewed' || status === 'accepted' || status === 'rejected') {
//           applicationData.status = status;
//         }
//       } else if (ctx.request.body.data && typeof ctx.request.body.data === 'object') {
//         // Try to find the status in the data object
//         for (const key in ctx.request.body.data) {
//           if (key.includes('status')) {
//             const status = ctx.request.body.data[key];
//             if (status === 'pending' || status === 'reviewed' || status === 'accepted' || status === 'rejected') {
//               applicationData.status = status;
//             }
//             break;
//           }
//         }
//       }
      
//       console.log('Final application data:', applicationData);
      
//       const application = await strapi.entityService.create('api::application.application', {
//         data: applicationData
//       });

//       return { data: application };
//     } catch (err) {
//       console.error('Error in create:', err);
//       console.error('Error stack:', err.stack);
      
//       // Provide more detailed error message
//       if (err instanceof Error) {
//         return ctx.internalServerError(`An error occurred while submitting the application: ${err.message}`);
//       } else {
//         return ctx.internalServerError('An error occurred while submitting the application');
//       }
//     }
//   },

//   async update(ctx: any) {
//     try {
//       const { id } = ctx.params;
//       const { user } = ctx.state;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to update applications');
//       }

//       const application = await strapi.entityService.findOne('api::application.application', id, {
//         populate: {
//           job: {
//             populate: ['user']
//           },
//           applicant: true
//         }
//       }) as unknown as ApplicationEntity;

//       if (!application) {
//         return ctx.notFound('Application not found');
//       }

//       // Only allow employers to update application status
//       if (user.role !== 'employer' || application.attributes.job.data.attributes.user.data.id !== user.id) {
//         return ctx.forbidden('You do not have permission to update this application');
//       }

//       const updatedApplication = await strapi.entityService.update('api::application.application', id, {
//         data: ctx.request.body.data
//       });

//       return { data: updatedApplication };
//     } catch (err) {
//       console.error('Error in update:', err);
//       return ctx.internalServerError('An error occurred while updating the application');
//     }
//   },

//   async delete(ctx: any) {
//     try {
//       const { id } = ctx.params;
//       const { user } = ctx.state;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to delete applications');
//       }

//       const application = await strapi.entityService.findOne('api::application.application', id, {
//         populate: {
//           job: {
//             populate: ['user']
//           },
//           applicant: true
//         }
//       }) as unknown as ApplicationEntity;

//       if (!application) {
//         return ctx.notFound('Application not found');
//       }

//       // Only allow users to delete their own applications or employers to delete applications for their jobs
//       if (
//         (user.role === 'jobseeker' && application.attributes.applicant.data.id !== user.id) ||
//         (user.role === 'employer' && application.attributes.job.data.attributes.user.data.id !== user.id) ||
//         (user.role !== 'jobseeker' && user.role !== 'employer' && user.role !== 'admin')
//       ) {
//         return ctx.forbidden('You do not have permission to delete this application');
//       }

//       const deletedApplication = await strapi.entityService.delete('api::application.application', id);

//       return { data: deletedApplication };
//     } catch (err) {
//       console.error('Error in delete:', err);
//       return ctx.internalServerError('An error occurred while deleting the application');
//     }
//   }
// }));

// updated code
import { factories } from '@strapi/strapi';
import { Context } from 'koa';

// Define allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
] as const;

type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

interface UploadedFile {
  id: number;
  url: string;
  name: string;
  mime: AllowedMimeType;
}

interface ApplicationData {
  job: number;
  applicant: number;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter?: string;
  resume: number;
}

interface ApplicationEntity {
  id: number;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  resume: {
    id: number;
    documentId: string;
    url: string;
    name: string;
  } | null;
  job: {
    id: number;
    title: string;
    companyName: string;
    expiredAt?: string;
    user?: { id: number };
  } | null;
  applicant: {
    id: number;
    username: string;
    email: string;
  } | null;
}

interface JobEntity {
  id: number;
  title: string;
  companyName: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  user?: { id: number };
}

interface StrapiContext extends Context {
  state: {
    user?: {
      id: number;
      role: { name: string };
    };
  };
  request: Context['request'] & {
    body: {
      data?: string | Partial<ApplicationData>;
    };
    files?: {
      resume?: { name: string; type: string; size: number; path: string };
      'files.resume'?: { name: string; type: string; size: number; path: string };
    };
  };
  params: { id?: string };
}

export default factories.createCoreController('api::application.application', ({ strapi }) => ({
  async create(ctx: StrapiContext): Promise<any> {
    try {
      const { user } = ctx.state;
      if (!user) return ctx.unauthorized('You must be logged in to submit applications');
      const userRole = user.role.name.toLowerCase();
      if (userRole !== 'job seeker' && userRole !== 'jobseeker') {
        return ctx.forbidden('Only job seekers can submit applications');
      }

      console.log('Create - Raw Request Body:', JSON.stringify(ctx.request.body, null, 2));
      console.log('Create - Raw Request Files:', JSON.stringify(ctx.request.files, null, 2));

      let requestData: Partial<ApplicationData>;
      if (typeof ctx.request.body.data === 'string') {
        try {
          requestData = JSON.parse(ctx.request.body.data);
        } catch (err) {
          console.error('Create - JSON Parse Error:', err);
          return ctx.badRequest('Invalid JSON in data field');
        }
      } else {
        requestData = ctx.request.body.data || {};
      }
      console.log('Create - Parsed Request Data:', JSON.stringify(requestData, null, 2));

      const jobId = requestData.job;
      if (!jobId) return ctx.badRequest('Job ID is required');
      const parsedJobId = parseInt(jobId.toString(), 10);
      if (isNaN(parsedJobId)) return ctx.badRequest('Invalid job ID');

      const job = (await strapi.entityService.findOne('api::job.job', parsedJobId, {
        fields: ['id', 'title', 'companyName', 'expiredAt'],
        populate: { user: { fields: ['id'] } },
      })) as JobEntity | null;
      console.log('Create - Job Verification:', JSON.stringify(job, null, 2));
      if (!job) return ctx.notFound(`Job with ID ${parsedJobId} not found`);

      const existingApplications = (await strapi.entityService.findMany('api::application.application', {
        filters: { job: { id: parsedJobId }, applicant: { id: user.id } },
        populate: { job: true },
      })) as unknown as ApplicationEntity[];
      console.log('Create - Existing Applications:', JSON.stringify(existingApplications, null, 2));
      if (existingApplications.length > 0) return ctx.badRequest('You have already applied for this job');

      const resumeFile = ctx.request.files?.resume || ctx.request.files?.['files.resume'];
      if (!resumeFile) return ctx.badRequest('Resume file is required');

      const uploadService = strapi.plugins['upload'].services.upload;
      const uploadedFiles = await uploadService.upload({
        data: {},
        files: resumeFile,
      }) as UploadedFile[];
      console.log('Create - Uploaded Files:', JSON.stringify(uploadedFiles, null, 2));
      if (!uploadedFiles || uploadedFiles.length === 0 || !uploadedFiles[0].id) {
        return ctx.badRequest('Failed to upload resume file');
      }
      const resumeId = uploadedFiles[0].id;

      const applicationData: ApplicationData = {
        job: parsedJobId,
        applicant: user.id,
        status: 'pending',
        coverLetter: requestData.coverLetter || '',
        resume: resumeId,
      };
      console.log('Create - Application Data Before Save:', JSON.stringify(applicationData, null, 2));

      const application = (await strapi.entityService.create('api::application.application', {
        data: applicationData,
        populate: {
          job: { fields: ['id', 'title', 'companyName', 'expiredAt'], populate: { user: { fields: ['id'] } } },
          applicant: { fields: ['id', 'username', 'email'] },
          resume: { fields: ['id', 'url', 'name'] },
        },
      })) as unknown as ApplicationEntity;
      console.log('Create - Application Created:', JSON.stringify(application, null, 2));

      const savedApplication = (await strapi.entityService.findOne('api::application.application', application.id, {
        populate: { job: { fields: ['id', 'title', 'companyName', 'expiredAt'] } },
      })) as unknown as ApplicationEntity;
      console.log('Create - Saved Application with Job:', JSON.stringify(savedApplication, null, 2));

      if (!savedApplication.job) {
        console.error('Create - Job relation not saved correctly for application ID:', application.id);
        await strapi.entityService.update('api::application.application', application.id, {
          data: { job: parsedJobId },
        });
        const repairedApplication = (await strapi.entityService.findOne('api::application.application', application.id, {
          populate: { job: { fields: ['id', 'title', 'companyName', 'expiredAt'] } },
        })) as unknown as ApplicationEntity;
        console.log('Create - Repaired Application:', JSON.stringify(repairedApplication, null, 2));

        const rawApplication = await strapi.db.query('api::application.application').findOne({
          where: { id: application.id },
          populate: { job: true },
        });
        console.log('Create - Raw Database Entry:', JSON.stringify(rawApplication, null, 2));

        if (!repairedApplication.job) {
          console.error('Create - Repair failed. Job ID in database:', rawApplication?.job?.id);
        }
        return { data: repairedApplication };
      }

      return { data: application };
    } catch (err) {
      console.error('Create - Error:', err);
      return ctx.internalServerError('An error occurred while submitting the application');
    }
  },

  async find(ctx: StrapiContext): Promise<any> {
    try {
      const { user } = ctx.state;
      if (!user) return ctx.unauthorized('You must be logged in to view applications');

      const userRoleLower = user.role.name.toLowerCase();
      const filters: Record<string, any> =
        userRoleLower === 'jobseeker' || userRoleLower === 'job seeker'
          ? { applicant: { id: user.id } }
          : userRoleLower === 'employer'
          ? { job: { user: { id: user.id } } }
          : {};

      console.log('Find - Filters:', JSON.stringify(filters, null, 2));

      const populateFields = {
        job: { fields: ['id', 'title', 'companyName', 'expiredAt'], populate: { user: { fields: ['id'] } } },
        applicant: { fields: ['id', 'username', 'email'] },
        resume: { fields: ['id', 'url', 'name'] },
      };

      const applications = (await strapi.entityService.findMany('api::application.application', {
        populate: populateFields as any,
        filters,
      })) as unknown as ApplicationEntity[];
      console.log('Find - Initial Fetch:', JSON.stringify(applications, null, 2));

      for (const app of applications) {
        if (!app.job) {
          console.warn(`Find - Application ID ${app.id} has null job after initial fetch`);
          const rawApp = await strapi.db.query('api::application.application').findOne({
            where: { id: app.id },
            populate: { job: true },
          });
          console.log(`Find - Raw Database Entry for ID ${app.id}:`, JSON.stringify(rawApp, null, 2));

          if (rawApp?.job?.id) {
            const jobData = (await strapi.entityService.findOne('api::job.job', rawApp.job.id, {
              fields: ['id', 'title', 'companyName', 'expiredAt'],
              populate: { user: { fields: ['id'] } },
            })) as JobEntity | null;
            console.log(`Find - Manually Fetched Job for ID ${app.id}:`, JSON.stringify(jobData, null, 2));
            if (jobData) {
              app.job = jobData;
            } else {
              console.error(`Find - Job ID ${rawApp.job.id} not found in jobs table`);
            }
          } else {
            console.error(`Find - No job ID found in database for application ID ${app.id}`);
          }
        }
      }

      console.log('Find - Final Applications with Manual Job Fetch:', JSON.stringify(applications, null, 2));
      return { data: applications };
    } catch (err) {
      console.error('Find - Error:', err);
      return ctx.internalServerError('An error occurred while fetching applications');
    }
  },

  async update(ctx: StrapiContext): Promise<any> {
    try {
      const { id: idStr } = ctx.params;
      const { user } = ctx.state;
      const { data: requestData } = ctx.request.body;

      console.log(`Update - Attempting update for application ID: ${idStr}`);
      console.log(`Update - User: ${user?.id}, Role: ${user?.role?.name}`);
      console.log(`Update - Request Data:`, JSON.stringify(requestData, null, 2));

      if (!user) return ctx.unauthorized('You must be logged in to update applications');
      if (!idStr) return ctx.badRequest('Application ID is required');
      if (!requestData || !requestData.status) return ctx.badRequest('New status is required in data object');

      const id = parseInt(idStr, 10);
      if (isNaN(id)) return ctx.badRequest('Invalid application ID');

      const newStatus = requestData.status;
      const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
      if (!validStatuses.includes(newStatus)) {
        return ctx.badRequest(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }

      const application = (await strapi.entityService.findOne('api::application.application', id, {
        populate: {
          job: { populate: { user: { fields: ['id'] } } },
        },
      })) as unknown as ApplicationEntity;
      console.log('Update - Fetched application:', JSON.stringify(application, null, 2));

      if (!application) return ctx.notFound('Application not found');

      const userRole = user.role.name.toLowerCase();
      const jobUserId = application.job?.user?.id;
      console.log('Update - Permission check info:', { userRole, userId: user.id, jobUserId });

      if (userRole !== 'employer' || !jobUserId || jobUserId !== user.id) {
        console.warn('Update - Permission denied');
        return ctx.forbidden('You do not have permission to update this application status');
      }

      console.log('Update - Permission granted. Proceeding with update.');
      const updatedApplication = (await strapi.entityService.update('api::application.application', id, {
        data: { status: newStatus },
        populate: {
          job: { fields: ['id', 'title', 'companyName', 'expiredAt'], populate: { user: { fields: ['id'] } } },
          applicant: { fields: ['id', 'username', 'email'] },
          resume: { fields: ['id', 'url', 'name'] },
        },
      })) as unknown as ApplicationEntity;

      console.log('Update - Successfully updated:', JSON.stringify(updatedApplication, null, 2));
      return { data: updatedApplication };
    } catch (err) {
      console.error('Update - Error:', err);
      if (err instanceof Error) {
        console.error('Update - Error Stack:', err.stack);
        return ctx.internalServerError(`An error occurred while updating the application: ${err.message}`);
      }
      return ctx.internalServerError('An unknown error occurred while updating the application');
    }
  },

  async delete(ctx: StrapiContext): Promise<any> {
    try {
      const { id: idStr } = ctx.params;
      const { user } = ctx.state;
      console.log(`Delete - Attempting to delete application ID: ${idStr}`);

      if (!user) return ctx.unauthorized('You must be logged in to delete applications');
      if (!idStr) return ctx.badRequest('Application ID is required');

      const id = parseInt(idStr, 10);
      if (isNaN(id)) return ctx.badRequest('Invalid application ID');

      const application = (await strapi.entityService.findOne('api::application.application', id, {
        populate: {
          job: { populate: { user: { fields: ['id'] } } },
          applicant: { fields: ['id'] },
        } as any,
      })) as unknown as ApplicationEntity;
      console.log('Delete - Fetched application:', JSON.stringify(application, null, 2));

      if (!application) return ctx.notFound('Application not found');

      const userRole = user.role.name.toLowerCase();
      const isJobSeeker = userRole === 'job seeker' || userRole === 'jobseeker';
      const isEmployer = userRole === 'employer';
      const isAdmin = userRole === 'admin' || userRole === 'super admin';

      const applicantId = application.applicant?.id;
      const jobUserId = application.job?.user?.id;
      console.log('Delete - Permission check info:', { userRole, userId: user.id, applicantId, jobUserId });

      const hasPermission =
        isAdmin || (isJobSeeker && applicantId === user.id) || (isEmployer && jobUserId === user.id);

      if (!hasPermission) {
        console.warn('Delete - Permission denied');
        return ctx.forbidden('You do not have permission to delete this application');
      }

      console.log('Delete - Permission granted. Proceeding with deletion.');
      const deletedApplication = await strapi.entityService.delete('api::application.application', id);
      console.log('Delete - Successfully deleted:', JSON.stringify(deletedApplication, null, 2));

      return { data: { id: deletedApplication.id, message: 'Application deleted successfully' } };
    } catch (err) {
      console.error('Delete - Error:', err);
      if (err instanceof Error) {
        console.error('Delete - Error Stack:', err.stack);
        return ctx.internalServerError(`An error occurred while deleting the application: ${err.message}`);
      }
      return ctx.internalServerError('An unknown error occurred while deleting the application');
    }
  },
}));