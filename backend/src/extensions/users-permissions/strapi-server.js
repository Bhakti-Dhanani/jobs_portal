module.exports = (plugin) => {
  // Override the me endpoint to ensure it works for authenticated users
  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }
    
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      ctx.state.user.id,
      { populate: ['role'] }
    );

    ctx.body = user;
  };

  // Override the callback action to ensure proper error handling
  plugin.controllers.auth.callback = async (ctx) => {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const grantSettings = await store.get({ key: 'grant' });

    const grantProvider = provider === 'local' ? 'email' : provider;

    if (!grantSettings[grantProvider].enabled) {
      throw new Error('This provider is disabled');
    }

    if (provider === 'local') {
      if (!params.identifier) {
        throw new Error('Please provide your username/email');
      }

      if (!params.password) {
        throw new Error('Please provide your password');
      }

      const query = { provider };

      // Check if the provided identifier is an email or not.
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.identifier);

      if (isEmail) {
        query.email = params.identifier.toLowerCase();
      } else {
        query.username = params.identifier;
      }

      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: query,
        populate: ['role'],
      });

      if (!user) {
        throw new Error('Invalid identifier or password');
      }

      if (user.blocked) {
        throw new Error('Your account has been blocked by an administrator');
      }

      const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        params.password,
        user.password
      );

      if (!validPassword) {
        throw new Error('Invalid identifier or password');
      }

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      });

      return {
        jwt,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    }

    // Connect the user with a third-party provider.
    throw new Error('This provider is not supported');
  };

  return plugin;
}; 