/**
 * application controller
 */

import { factories } from '@strapi/strapi'
import { Context } from 'koa'
import { errors } from '@strapi/utils'

// Define the Application interface based on the schema
interface ApplicationData {
  app_status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  job: number;
  applicant: number;
  coverLetter: string;
  resume: number;
}

// Define the query interface
interface QueryFilters {
  job?: number;
  applicant?: number;
  [key: string]: any;
}

interface Query {
  filters?: QueryFilters;
  [key: string]: any;
}

// Define the Strapi entity structure
interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

interface ApplicationAttributes {
  resume: any;
  coverLetter: string;
  app_status: string;
  job: {
    data: {
      id: number;
      attributes: any;
    };
  };
  applicant: {
    data: {
      id: number;
      attributes: any;
    };
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ApplicationEntity {
  id: number;
  attributes: {
    app_status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
    coverLetter: string;
    resume: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    job: {
      data: {
        id: number;
        attributes: {
          user: {
            data: {
              id: number;
            };
          };
        };
      };
    };
    applicant: {
      data: {
        id: number;
      };
    };
  };
}

// Use type assertion to fix the TypeScript error
export default factories.createCoreController('api::application.application', ({ strapi }) => ({
  async find(ctx: any) {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to view applications');
      }

      // Use type assertion to bypass TypeScript errors
      const queryOptions: any = {
        populate: {
          job: {
            populate: ['user']
          },
          applicant: true
        }
      };

      if (user.role === 'jobseeker') {
        queryOptions.filters = { applicant: { id: user.id } };
      } else if (user.role === 'employer') {
        queryOptions.filters = { job: { user: { id: user.id } } };
      }

      const applications = await strapi.entityService.findMany('api::application.application', queryOptions);

      return { data: applications };
    } catch (err) {
      console.error('Error in find:', err);
      return ctx.internalServerError('An error occurred while fetching applications');
    }
  },

  async findOne(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to view applications');
      }

      const application = await strapi.entityService.findOne('api::application.application', id, {
        populate: {
          job: {
            populate: ['user']
          },
          applicant: true
        }
      }) as unknown as ApplicationEntity;

      if (!application) {
        return ctx.notFound('Application not found');
      }

      // Only allow users to view their own applications or employers to view applications for their jobs
      if (
        (user.role === 'jobseeker' && application.attributes.applicant.data.id !== user.id) ||
        (user.role === 'employer' && application.attributes.job.data.attributes.user.data.id !== user.id) ||
        (user.role !== 'jobseeker' && user.role !== 'employer' && user.role !== 'admin')
      ) {
        return ctx.forbidden('You do not have permission to view this application');
      }

      return { data: application };
    } catch (err) {
      console.error('Error in findOne:', err);
      return ctx.internalServerError('An error occurred while fetching the application');
    }
  },

  async create(ctx: any) {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to submit applications');
      }

      if (user.role !== 'jobseeker') {
        return ctx.forbidden('Only jobseekers can submit applications');
      }

      // Check if job exists
      const job = await strapi.entityService.findOne('api::job.job', ctx.request.body.data.job, {
        populate: ['user']
      });

      if (!job) {
        return ctx.notFound('Job not found');
      }

      // Check if already applied
      const existingApplications = await strapi.entityService.findMany('api::application.application', {
        filters: {
          job: { id: job.id },
          applicant: { id: user.id }
        }
      });

      if (existingApplications.length > 0) {
        return ctx.badRequest('You have already applied for this job');
      }

      const application = await strapi.entityService.create('api::application.application', {
        data: {
          ...ctx.request.body.data,
          applicant: user.id,
          app_status: 'pending',
          coverLetter: ctx.request.body.data.coverLetter || '',
          resume: ctx.request.body.data.resume || null
        }
      });

      return { data: application };
    } catch (err) {
      console.error('Error in create:', err);
      return ctx.internalServerError('An error occurred while submitting the application');
    }
  },

  async update(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to update applications');
      }

      const application = await strapi.entityService.findOne('api::application.application', id, {
        populate: {
          job: {
            populate: ['user']
          },
          applicant: true
        }
      }) as unknown as ApplicationEntity;

      if (!application) {
        return ctx.notFound('Application not found');
      }

      // Only allow employers to update application status
      if (user.role !== 'employer' || application.attributes.job.data.attributes.user.data.id !== user.id) {
        return ctx.forbidden('You do not have permission to update this application');
      }

      const updatedApplication = await strapi.entityService.update('api::application.application', id, {
        data: ctx.request.body.data
      });

      return { data: updatedApplication };
    } catch (err) {
      console.error('Error in update:', err);
      return ctx.internalServerError('An error occurred while updating the application');
    }
  },

  async delete(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to delete applications');
      }

      const application = await strapi.entityService.findOne('api::application.application', id, {
        populate: {
          job: {
            populate: ['user']
          },
          applicant: true
        }
      }) as unknown as ApplicationEntity;

      if (!application) {
        return ctx.notFound('Application not found');
      }

      // Only allow users to delete their own applications or employers to delete applications for their jobs
      if (
        (user.role === 'jobseeker' && application.attributes.applicant.data.id !== user.id) ||
        (user.role === 'employer' && application.attributes.job.data.attributes.user.data.id !== user.id) ||
        (user.role !== 'jobseeker' && user.role !== 'employer' && user.role !== 'admin')
      ) {
        return ctx.forbidden('You do not have permission to delete this application');
      }

      const deletedApplication = await strapi.entityService.delete('api::application.application', id);

      return { data: deletedApplication };
    } catch (err) {
      console.error('Error in delete:', err);
      return ctx.internalServerError('An error occurred while deleting the application');
    }
  }
}));
