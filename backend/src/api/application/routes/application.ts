export default {
  routes: [
    {
      method: 'GET',
      path: '/applications',
      handler: 'application.find',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/applications/:id',
      handler: 'application.findOne',
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
      path: '/applications',
      handler: 'application.create',
      config: {
        policies: ['global::is-authenticated'],
      },
    },
    {
      method: 'PUT',
      path: '/applications/:id',
      handler: 'application.update',
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
      path: '/applications/:id',
      handler: 'application.delete',
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