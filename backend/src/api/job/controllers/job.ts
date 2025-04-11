
// 'use strict';

// /**
//  * job controller
//  */

// import { factories } from '@strapi/strapi';
// import { Context } from 'koa';

// interface JobData {
//   title: string;
//   description: string;
//   requirements: string;
//   salary: number;
//   location: string;
//   jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
//   experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
//   companyName: string;
//   industry: string;
//   expiredAt: string;
//   requestId?: string; // Optional requestId from frontend
// }

// interface QueryFilters {
//   user?: number;
//   requestId?: string; // Explicitly allow requestId as a filter
//   [key: string]: any; // Allow additional dynamic filters
// }

// interface Query {
//   filters?: QueryFilters;
//   populate?: string[];
//   [key: string]: any;
// }

// interface JobContext extends Context {
//   query: Query;
// }

// interface JobAttributes {
//   title: string;
//   description: string;
//   requirements: string;
//   salary: number;
//   location: string;
//   jobType: string;
//   experienceLevel: string;
//   companyName: string;
//   industry: string;
//   expiredAt: string | null;
//   user: {
//     data: {
//       id: number;
//       attributes: any;
//     } | null;
//   } | null;
//   createdAt: string;
//   updatedAt: string;
//   publishedAt: string | null;
//   requestId?: string; // Add requestId as an optional attribute
// }

// interface JobEntity {
//   id: number;
//   attributes: JobAttributes;
// }

// export default factories.createCoreController('api::job.job', ({ strapi }) => ({
//   async find(ctx: JobContext) {
//     try {
//       const user = ctx.state.user;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to view jobs');
//       }

//       const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
//         populate: ['users'],
//       });

//       if (userRole.name === 'Employer') {
//         const jobs = await strapi.entityService.findMany('api::job.job', {
//           filters: { user: user.id },
//           populate: ['user'],
//         }) as unknown as JobEntity[];

//         return {
//           data: jobs || [],
//           meta: { pagination: { page: 1, pageSize: 25, pageCount: Math.ceil((jobs?.length || 0) / 25), total: jobs?.length || 0 } },
//         };
//       }

//       const result = await super.find(ctx);

//       return {
//         data: result.data || [],
//         meta: result.meta || { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
//       };
//     } catch (error) {
//       console.error('Error in find method:', error);
//       return {
//         data: [],
//         meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
//       };
//     }
//   },

//   async findOne(ctx: JobContext) {
//     try {
//       const user = ctx.state.user;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to view job details');
//       }

//       const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
//         populate: ['users'],
//       });

//       const { data, meta } = await super.findOne(ctx);

//       if (userRole.name === 'Employer' && data.attributes.user?.data?.id !== user.id) {
//         return ctx.forbidden('You do not have permission to view this job');
//       }

//       return { data, meta };
//     } catch (error) {
//       console.error('Error in findOne method:', error);
//       return ctx.internalServerError('An error occurred while fetching job details');
//     }
//   },

//   async create(ctx: JobContext) {
//     try {
//       const user = ctx.state.user;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to create a job');
//       }

//       if (user.role.name !== 'Employer') {
//         return ctx.unauthorized('Only employers can create jobs');
//       }

//       const { data } = ctx.request.body;

//       if (!data) {
//         return ctx.badRequest('No data provided');
//       }

//       const requiredFields = ['title', 'description', 'salary', 'location', 'jobType', 'experienceLevel', 'companyName', 'expiredAt'];
//       for (const field of requiredFields) {
//         if (!data[field]) {
//           return ctx.badRequest(`Missing required field: ${field}`);
//         }
//       }

//       if (typeof data.salary !== 'number') {
//         return ctx.badRequest('Salary must be a number');
//       }

//       const validJobTypes = ['full-time', 'part-time', 'contract', 'internship'];
//       if (!validJobTypes.includes(data.jobType)) {
//         return ctx.badRequest('Invalid job type');
//       }

//       const validExperienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
//       if (!validExperienceLevels.includes(data.experienceLevel)) {
//         return ctx.badRequest('Invalid experience level');
//       }

//       // Generate or use requestId for idempotency
//       const requestId = data.requestId || Date.now().toString();

//       // Check for existing job with the same requestId
//       const existingJobs = await strapi.entityService.findMany('api::job.job', {
//         filters: { requestId }, // Now valid with updated QueryFilters
//         populate: ['user'],
//         limit: 1,
//       }) as unknown as JobEntity[];

//       if (existingJobs.length > 0) {
//         console.log('Duplicate request detected, returning existing job:', existingJobs[0]);
//         return ctx.created(existingJobs[0]);
//       }

//       const jobData = {
//         ...data,
//         user: user.id,
//         publishedAt: new Date(), // Ensure publishedAt is always set
//         requirements: data.requirements || 'No specific requirements',
//         industry: data.industry || 'Technology',
//         requestId, // Use the generated or provided requestId
//         draft: false, // Force publish to avoid draft duplicates
//       };

//       console.log('Creating job with data:', jobData);

//       const job = await strapi.entityService.create('api::job.job', {
//         data: jobData,
//       });

//       console.log('Job created successfully:', job);

//       return ctx.created(job);
//     } catch (error) {
//       console.error('Error creating job:', error);
//       return ctx.internalServerError(error.message || 'Error creating job');
//     }
//   },

//   async update(ctx: JobContext) {
//     try {
//       const user = ctx.state.user;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to update a job');
//       }

//       const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
//         populate: ['users'],
//       });

//       if (userRole.name !== 'Employer') {
//         return ctx.forbidden('Only employers can update jobs');
//       }

//       const job = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
//         populate: ['user'],
//       }) as unknown as JobEntity;

//       if (job.attributes.user?.data?.id !== user.id) {
//         return ctx.forbidden('You do not have permission to update this job');
//       }

//       const response = await super.update(ctx);

//       return response;
//     } catch (error) {
//       console.error('Error in update method:', error);
//       return ctx.internalServerError('An error occurred while updating the job');
//     }
//   },

//   async delete(ctx: JobContext) {
//     try {
//       const user = ctx.state.user;

//       if (!user) {
//         return ctx.unauthorized('You must be logged in to delete a job');
//       }

//       const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
//         populate: ['users'],
//       });

//       if (userRole.name !== 'Employer') {
//         return ctx.forbidden('Only employers can delete jobs');
//       }

//       const job = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
//         populate: ['user'],
//       }) as unknown as JobEntity;

//       if (job.attributes.user?.data?.id !== user.id) {
//         return ctx.forbidden('You do not have permission to delete this job');
//       }

//       const response = await super.delete(ctx);

//       return response;
//     } catch (error) {
//       console.error('Error in delete method:', error);
//       return ctx.internalServerError('An error occurred while deleting the job');
//     }
//   },
// }));
import { factories } from '@strapi/strapi';
import { Context } from 'koa';

interface JobData {
  title: string;
  description: string;
  requirements: string;
  salary: number;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyName: string;
  industry: string;
  expiredAt: string;
  requestId?: string;
}

interface QueryFilters {
  user?: number;
  requestId?: string;
  [key: string]: any;
}

interface Query {
  filters?: QueryFilters;
  populate?: string[];
  [key: string]: any;
}

interface JobContext extends Context {
  query: Query;
}

interface Job {
  id: string | number;
  title?: string;
  description?: string;
  requirements?: string;
  salary?: number;
  location?: string;
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyName?: string;
  industry?: string;
  expiredAt?: string | Date | null;
  user?: {
    id: number;
    username?: string;
    email?: string;
  } | null;
  createdAt?: string | Date | null; // Updated to allow string, Date, or null
  updatedAt?: string | Date | null; // Updated to allow string, Date, or null
  publishedAt?: string | Date | null; // Updated to allow string, Date, or null
  requestId?: string;
}

export default factories.createCoreController('api::job.job', ({ strapi }) => ({
  async find(ctx: JobContext) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to view jobs');
      }

      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      if (userRole.name === 'Employer') {
        const jobs: Job[] = await strapi.entityService.findMany('api::job.job', {
          filters: { user: user.id },
          populate: ['user'],
        });

        return {
          data: jobs || [],
          meta: { pagination: { page: 1, pageSize: 25, pageCount: Math.ceil((jobs?.length || 0) / 25), total: jobs?.length || 0 } },
        };
      }

      const result = await super.find(ctx);
      return {
        data: result.data || [],
        meta: result.meta || { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
      };
    } catch (error) {
      console.error('Error in find method:', error);
      return ctx.internalServerError('An error occurred while fetching jobs');
    }
  },

  async findOne(ctx: JobContext) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to view job details');
      }

      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      const job: Job | null = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
        populate: ['user'],
      });

      if (!job) {
        return ctx.notFound('Job not found');
      }

      if (userRole.name === 'Employer' && (!job.user || job.user.id !== user.id)) {
        return ctx.forbidden('You do not have permission to view this job');
      }

      return { data: job };
    } catch (error) {
      console.error('Error in findOne method:', error);
      return ctx.internalServerError('An error occurred while fetching job details');
    }
  },

  async create(ctx: JobContext) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to create a job');
      }

      if (user.role.name !== 'Employer') {
        return ctx.unauthorized('Only employers can create jobs');
      }

      const { data }: { data: JobData } = ctx.request.body;

      if (!data) {
        return ctx.badRequest('No data provided');
      }

      const requiredFields = ['title', 'description', 'salary', 'location', 'jobType', 'experienceLevel', 'companyName', 'expiredAt'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return ctx.badRequest(`Missing required field: ${field}`);
        }
      }

      if (typeof data.salary !== 'number') {
        return ctx.badRequest('Salary must be a number');
      }

      const validJobTypes = ['full-time', 'part-time', 'contract', 'internship'];
      if (!validJobTypes.includes(data.jobType)) {
        return ctx.badRequest('Invalid job type');
      }

      const validExperienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
      if (!validExperienceLevels.includes(data.experienceLevel)) {
        return ctx.badRequest('Invalid experience level');
      }

      const requestId = data.requestId || Date.now().toString();

      const existingJobs = await strapi.entityService.findMany('api::job.job', {
        filters: { requestId },
        populate: ['user'],
      });

      if (existingJobs.length > 0) {
        console.log('Duplicate request detected, returning existing job:', existingJobs[0]);
        return ctx.created(existingJobs[0]);
      }

      const jobData = {
        ...data,
        user: user.id,
        publishedAt: new Date(),
        requirements: data.requirements || 'No specific requirements',
        industry: data.industry || 'Technology',
        requestId,
        draft: false,
      };

      console.log('Creating job with data:', jobData);

      const job: Job = await strapi.entityService.create('api::job.job', {
        data: jobData,
      });

      console.log('Job created successfully:', job);

      return ctx.created(job);
    } catch (error) {
      console.error('Error creating job:', error);
      return ctx.internalServerError('An error occurred while creating the job');
    }
  },

  async update(ctx: JobContext) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in to update a job');
      }

      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      if (userRole.name !== 'Employer') {
        return ctx.forbidden('Only employers can update jobs');
      }

      const job: Job | null = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
        populate: ['user'],
      });

      if (!job) {
        return ctx.notFound('Job not found');
      }

      if (!job.user || job.user.id !== user.id) {
        return ctx.forbidden('You do not have permission to update this job');
      }

      const response = await super.update(ctx);
      return response;
    } catch (error) {
      console.error('Error in update method:', error);
      return ctx.internalServerError('An error occurred while updating the job');
    }
  },

  async delete(ctx: JobContext) {
    try {
      const user = ctx.state.user;

      if (!user) {
        ctx.status = 401;
        ctx.body = { error: { status: 401, name: 'Unauthorized', message: 'You must be logged in to delete a job' } };
        return;
      }

      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      if (userRole.name !== 'Employer') {
        ctx.status = 403;
        ctx.body = { error: { status: 403, name: 'Forbidden', message: 'Only employers can delete jobs' } };
        return;
      }

      const job: Job | null = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
        populate: ['user'],
      });

      console.log('Fetched job:', JSON.stringify(job, null, 2));

      if (!job) {
        ctx.status = 404;
        ctx.body = { error: { status: 404, name: 'NotFound', message: 'Job not found' } };
        return;
      }

      if (!job.user || job.user.id !== user.id) {
        ctx.status = 403;
        ctx.body = { error: { status: 403, name: 'Forbidden', message: 'You do not have permission to delete this job' } };
        return;
      }

      const applications = await strapi.entityService.findMany('api::application.application', {
        filters: { job: ctx.params.id },
      });

      for (const application of applications) {
        try {
          await strapi.entityService.delete('api::application.application', application.id);
          console.log(`Deleted application ${application.id} for job ${ctx.params.id}`);
        } catch (appError) {
          console.error(`Failed to delete application ${application.id}:`, appError);
          throw new Error(`Failed to delete application ${application.id}: ${(appError as Error).message}`);
        }
      }

      await strapi.entityService.delete('api::job.job', ctx.params.id);
      console.log('Job deleted successfully:', ctx.params.id);

      ctx.status = 200;
      ctx.body = { data: { id: ctx.params.id }, message: 'Job deleted successfully' };
    } catch (error) {
      console.error('Error in delete method:', error, error.stack);
      ctx.status = 500;
      ctx.body = {
        error: {
          status: 500,
          name: 'InternalServerError',
          message: 'An error occurred while deleting the job',
          details: (error as Error).message || 'Unknown error',
        },
      };
    }
  },
}));