'use strict';

/**
 * job controller
 */

import { factories } from '@strapi/strapi'
import { Context } from 'koa'

interface JobData {
  title: string;
  description: string;
  requirements: string;
  salary: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  companyName: string;
  industry: string;
  expiredAt: string;
}

// Define the query interface
interface QueryFilters {
  user?: number;
  [key: string]: any;
}

interface Query {
  filters?: QueryFilters;
  [key: string]: any;
}

// Extend the Context type to include our custom query type
interface JobContext extends Context {
  query: Query;
}

// Define the Strapi entity structure
interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

interface JobAttributes {
  title: string;
  description: string;
  requirements: string;
  salary: number;
  location: string;
  jobType: string;
  experienceLevel: string;
  companyName: string;
  industry: string;
  expiredAt: string;
  user: {
    data: {
      id: number;
      attributes: any;
    };
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Define the job entity with user relationship
interface JobEntity {
  id: number;
  attributes: JobAttributes;
  user?: {
    id: number;
    attributes: any;
  };
}

// Use type assertion to fix the TypeScript error
export default factories.createCoreController('api::job.job' as any, ({ strapi }) => ({
  async find(ctx: JobContext) {
    try {
      // Get the user from the request
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to view jobs');
      }

      // Get the user's role
      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      // If the user is an employer, only show their own jobs
      if (userRole.name === 'Employer') {
        try {
          // Use entityService directly to fetch jobs
          const jobs = await strapi.entityService.findMany('api::job.job', {
            filters: {
              user: user.id
            },
            populate: ['user'],
          });

          return {
            data: jobs || [],
            meta: { pagination: { page: 1, pageSize: 25, pageCount: Math.ceil((jobs?.length || 0) / 25), total: jobs?.length || 0 } }
          };
        } catch (error) {
          console.error('Error fetching jobs with entityService:', error);
          return {
            data: [],
            meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } }
          };
        }
      }

      // For non-employers, use the default find controller
      const result = await super.find(ctx);
      
      return {
        data: result.data || [],
        meta: result.meta || { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } }
      };
    } catch (error) {
      console.error('Error in find method:', error);
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } }
      };
    }
  },

  async findOne(ctx: JobContext) {
    try {
      // Get the user from the request
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to view job details');
      }

      // Get the user's role
      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      // Call the default findOne controller
      const { data, meta } = await super.findOne(ctx);

      // If the user is an employer, check if they own the job
      if (userRole.name === 'Employer' && data.attributes.user?.data?.id !== user.id) {
        return ctx.forbidden('You do not have permission to view this job');
      }

      return { data, meta };
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

      const { data } = ctx.request.body;

      if (!data) {
        return ctx.badRequest('No data provided');
      }

      // Ensure required fields are present
      const requiredFields = ['title', 'description', 'salary', 'location', 'jobType', 'experienceLevel', 'companyName'];
      for (const field of requiredFields) {
        if (!data[field]) {
          return ctx.badRequest(`Missing required field: ${field}`);
        }
      }

      // Validate salary is a number
      if (typeof data.salary !== 'number') {
        return ctx.badRequest('Salary must be a number');
      }

      // Validate jobType is valid
      const validJobTypes = ['full-time', 'part-time', 'contract', 'internship'];
      if (!validJobTypes.includes(data.jobType)) {
        return ctx.badRequest('Invalid job type');
      }

      // Validate experienceLevel is valid
      const validExperienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
      if (!validExperienceLevels.includes(data.experienceLevel)) {
        return ctx.badRequest('Invalid experience level');
      }

      // Format the job data
      const jobData = {
        ...data,
        user: user.id,
        publishedAt: new Date(),
        requirements: data.requirements || "No specific requirements",
        industry: data.industry || "Technology"
      };

      console.log('Creating job with data:', jobData);

      // Create the job
      const job = await strapi.entityService.create('api::job.job', {
        data: jobData
      });

      console.log('Job created successfully:', job);

      return ctx.created(job);
    } catch (error) {
      console.error('Error creating job:', error);
      return ctx.internalServerError(error.message || 'Error creating job');
    }
  },

  async update(ctx: JobContext) {
    try {
      // Get the user from the request
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to update a job');
      }

      // Get the user's role
      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      // Check if the user is an employer
      if (userRole.name !== 'Employer') {
        return ctx.forbidden('Only employers can update jobs');
      }

      // Get the job
      const job = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
        populate: ['user'],
      }) as unknown as JobEntity;

      // Check if the user owns the job
      if (job.user?.id !== user.id) {
        return ctx.forbidden('You do not have permission to update this job');
      }

      // Call the default update controller
      const response = await super.update(ctx);
      
      return response;
    } catch (error) {
      console.error('Error in update method:', error);
      return ctx.internalServerError('An error occurred while updating the job');
    }
  },

  async delete(ctx: JobContext) {
    try {
      // Get the user from the request
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to delete a job');
      }

      // Get the user's role
      const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
        populate: ['users'],
      });

      // Check if the user is an employer
      if (userRole.name !== 'Employer') {
        return ctx.forbidden('Only employers can delete jobs');
      }

      // Get the job
      const job = await strapi.entityService.findOne('api::job.job', ctx.params.id, {
        populate: ['user'],
      }) as unknown as JobEntity;

      // Check if the user owns the job
      if (job.user?.id !== user.id) {
        return ctx.forbidden('You do not have permission to delete this job');
      }

      // Call the default delete controller
      const response = await super.delete(ctx);
      
      return response;
    } catch (error) {
      console.error('Error in delete method:', error);
      return ctx.internalServerError('An error occurred while deleting the job');
    }
  },
}));
