/**
 * job router
 */

import { factories } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'POST',
      path: '/jobs',
      handler: 'job.create',
      config: {
        auth: {
          enabled: true
        },
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'GET',
      path: '/jobs',
      handler: 'job.find',
      config: {
        auth: {
          enabled: true
        },
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'GET',
      path: '/jobs/:id',
      handler: 'job.findOne',
      config: {
        auth: {
          enabled: true
        },
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'PUT',
      path: '/jobs/:id',
      handler: 'job.update',
      config: {
        auth: {
          enabled: true
        },
        policies: ['global::is-authenticated']
      }
    },
    {
      method: 'DELETE',
      path: '/jobs/:id',
      handler: 'job.delete',
      config: {
        auth: {
          enabled: true
        },
        policies: ['global::is-authenticated']
      }
    }
  ]
};
