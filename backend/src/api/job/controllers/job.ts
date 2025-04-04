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
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'open' | 'closed';
}

// Define the query interface
interface QueryFilters {
  employer?: number;
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
  salary: string;
  location: string;
  type: string;
  status: string;
  employer: {
    data: {
      id: number;
      attributes: any;
    };
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export default factories.createCoreController('api::job.job', ({ strapi }) => ({
  async create(ctx: JobContext) {
    // Get the user from the request
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in to create a job');
    }

    // Get the user's role
    const userRole = await strapi.entityService.findOne('plugin::users-permissions.role', user.role.id, {
      populate: ['users'],
    });

    // Check if the user is an employer
    if (userRole.name !== 'Employer') {
      return ctx.forbidden('Only employers can create jobs');
    }

    // Structure the data properly for Strapi
    const jobData = {
      data: {
        title: ctx.request.body.title,
        description: ctx.request.body.description,
        requirements: ctx.request.body.requirements,
        salary: ctx.request.body.salary,
        location: ctx.request.body.location,
        type: ctx.request.body.type,
        status: ctx.request.body.status,
        employer: user.id,
        publishedAt: new Date(),
        expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        jobType: ctx.request.body.type,
      }
    };

    // Create the job
    const entity = await strapi.entityService.create('api::job.job', jobData);

    // Return the created job
    return this.transformResponse(entity);
  },

  async find(ctx: JobContext) {
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
      // Initialize filters if it doesn't exist
      if (!ctx.query.filters) {
        ctx.query.filters = {};
      }
      
      // Add employer filter
      ctx.query.filters.employer = user.id;
    }

    // Call the default find controller
    const { data, meta } = await super.find(ctx);

    return { data, meta };
  },

  async findOne(ctx: JobContext) {
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
    const jobEmployerId = data.attributes.employer?.data?.id;
    if (userRole.name === 'Employer' && jobEmployerId !== user.id) {
      return ctx.forbidden('You do not have permission to view this job');
    }

    return { data, meta };
  },

  async update(ctx: JobContext) {
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
      populate: ['employer'],
    }) as unknown as StrapiEntity<JobAttributes>;

    // Check if the user owns the job
    const jobEmployerId = job.attributes.employer?.data?.id;
    if (jobEmployerId !== user.id) {
      return ctx.forbidden('You do not have permission to update this job');
    }

    // Structure the data properly for Strapi
    const jobData = {
      data: {
        title: ctx.request.body.title,
        description: ctx.request.body.description,
        requirements: ctx.request.body.requirements,
        salary: ctx.request.body.salary,
        location: ctx.request.body.location,
        type: ctx.request.body.type,
        status: ctx.request.body.status,
        employer: user.id,
        jobType: ctx.request.body.type,
      }
    };

    // Update the job
    const entity = await strapi.entityService.update('api::job.job', ctx.params.id, jobData);

    // Return the updated job
    return this.transformResponse(entity);
  },

  async delete(ctx: JobContext) {
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
      populate: ['employer'],
    }) as unknown as StrapiEntity<JobAttributes>;

    // Check if the user owns the job
    const jobEmployerId = job.attributes.employer?.data?.id;
    if (jobEmployerId !== user.id) {
      return ctx.forbidden('You do not have permission to delete this job');
    }

    // Delete the job
    const entity = await strapi.entityService.delete('api::job.job', ctx.params.id);

    // Return the deleted job
    return this.transformResponse(entity);
  },
}));
