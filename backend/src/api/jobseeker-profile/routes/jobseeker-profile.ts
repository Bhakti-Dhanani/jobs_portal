import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/jobseeker-profiles',
      handler: 'jobseeker-profile.find',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/jobseeker-profiles/:id',
      handler: 'jobseeker-profile.findOne',
      config: {
        policies: ['global::is-authenticated'],
        params: {
          id: {
            type: 'integer',
            required: true,
          },
        },
      },
    },
    {
      method: 'POST',
      path: '/jobseeker-profiles',
      handler: 'jobseeker-profile.create',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'PUT',
      path: '/jobseeker-profiles/:id',
      handler: 'jobseeker-profile.update',
      config: {
        policies: ['global::is-authenticated'],
        params: {
          id: {
            type: 'integer',
            required: true,
          },
        },
      },
    },
    {
      method: 'DELETE',
      path: '/jobseeker-profiles/:id',
      handler: 'jobseeker-profile.delete',
      config: {
        policies: ['global::is-authenticated'],
        params: {
          id: {
            type: 'integer',
            required: true,
          },
        },
      },
    },
  ],
}; 