'use strict';

/**
 * jobs controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::jobs.job', ({ strapi }) => ({
  async find(ctx) {
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
      ctx.query.filters = {
        ...ctx.query.filters,
        employer: user.id,
      };
    }

    // Call the default find controller
    const { data, meta } = await super.find(ctx);

    return { data, meta };
  },

  async findOne(ctx) {
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
    if (userRole.name === 'Employer' && data.attributes.employer?.data?.id !== user.id) {
      return ctx.forbidden('You do not have permission to view this job');
    }

    return { data, meta };
  },

  async create(ctx) {
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

    // Add the employer to the job data
    ctx.request.body.data.employer = user.id;

    // Call the default create controller
    const response = await super.create(ctx);
    
    return response;
  },

  async update(ctx) {
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
    const job = await strapi.entityService.findOne('api::jobs.job', ctx.params.id, {
      populate: ['employer'],
    });

    // Check if the user owns the job
    if (job.employer?.id !== user.id) {
      return ctx.forbidden('You do not have permission to update this job');
    }

    // Call the default update controller
    const response = await super.update(ctx);
    
    return response;
  },

  async delete(ctx) {
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
    const job = await strapi.entityService.findOne('api::jobs.job', ctx.params.id, {
      populate: ['employer'],
    });

    // Check if the user owns the job
    if (job.employer?.id !== user.id) {
      return ctx.forbidden('You do not have permission to delete this job');
    }

    // Call the default delete controller
    const response = await super.delete(ctx);
    
    return response;
  },
})); 