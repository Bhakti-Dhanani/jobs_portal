'use strict';

const bcrypt = require('bcryptjs');

module.exports = ({ strapi }) => ({
  // Create a new user
  async add(values) {
    const { password, ...data } = values;

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return strapi.entityService.create('plugin::users-permissions.user', { data });
  },

  // Validate password
  async validatePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  // Fetch user with role populated
  async fetch(query) {
    return strapi.entityService.findOne('plugin::users-permissions.user', {
      filters: query,
      populate: ['role'],
    });
  },

  // Find user by email (used in registration to check for duplicates)
  async findOne(query) {
    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: query,
      populate: ['role'],
    });
    return users.length > 0 ? users[0] : null;
  },
});