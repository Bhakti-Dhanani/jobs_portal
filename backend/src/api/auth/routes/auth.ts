'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/local/register',
      handler: 'auth.register',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/auth/local',
      handler: 'auth.callback',
      config: {
        auth: false,
      },
    },
  ],
};
