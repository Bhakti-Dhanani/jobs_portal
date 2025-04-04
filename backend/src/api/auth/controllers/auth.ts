'use strict';

/**
 * auth controller
 */

import { factories } from '@strapi/strapi';
import { User, AuthContext } from '../types';

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

interface CallbackRequest {
  identifier: string;
  password: string;
}

// @ts-ignore
export default factories.createCoreController('api::auth.auth', ({ strapi }) => ({
  async register(ctx: AuthContext) {
    try {
      const { username, email, password, role } = ctx.request.body as RegisterRequest;
      console.log('Registration request received:', { username, email, role });

      if (!username || !email || !password || !role) {
        console.log('Missing required fields:', { username, email, role });
        return ctx.badRequest("All fields are required");
      }

      // Fix: Use findMany instead of findOne and add better error handling
      console.log('Searching for role:', role);
      const roles = await strapi.entityService.findMany("plugin::users-permissions.role", {
        filters: { name: role },
      });
      console.log('Found roles:', roles);

      const roleEntity = roles.length > 0 ? roles[0] : null;

      if (!roleEntity) {
        console.log('Role not found:', role);
        return ctx.badRequest(`Invalid role: ${role}. Please ensure the role exists in the system.`);
      }

      // Fix: Use findMany instead of findOne for user lookup
      const existingUsers = await strapi.entityService.findMany("plugin::users-permissions.user", {
        filters: { email },
      });
      
      const existingUsersArray = Array.isArray(existingUsers) ? existingUsers : [existingUsers];
      
      if (existingUsersArray.length > 0) {
        console.log('Email already taken:', email);
        return ctx.badRequest("Email already taken");
      }

      const userData = {
        username,
        email,
        password,
        role: roleEntity.id,
        provider: "local",
        confirmed: true,
      };
      console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });

      const user = await strapi.plugins["users-permissions"].services.user.add(userData);
      
      // Fetch the user with populated role
      const populatedUser = await strapi.entityService.findOne("plugin::users-permissions.user", user.id, {
        populate: ['role'],
      }) as User;
      
      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({ id: user.id });

      // Manually sanitize the user data
      const sanitizedUser = {
        id: populatedUser.id,
        username: populatedUser.username,
        email: populatedUser.email,
        provider: populatedUser.provider,
        confirmed: populatedUser.confirmed,
        role: populatedUser.role,
      };

      ctx.created({ jwt, user: sanitizedUser });
    } catch (error) {
      console.error('Registration error:', error);
      return ctx.badRequest(error.message || "An error occurred during registration");
    }
  },

  async callback(ctx: AuthContext) {
    try {
      const { identifier, password } = ctx.request.body as CallbackRequest;
      if (!identifier || !password) {
        return ctx.badRequest("Identifier and password are required");
      }

      // Fix: Use findMany with populate for role
      const users = await strapi.entityService.findMany("plugin::users-permissions.user", {
        filters: {
          $or: [{ email: identifier }, { username: identifier }],
        },
        populate: ['role'],
      }) as User[];

      const user = users.length > 0 ? users[0] : null;

      if (!user || user.provider !== "local") {
        return ctx.badRequest("Invalid credentials");
      }

      const validPassword = await strapi.plugins["users-permissions"].services.user.validatePassword(password, user.password);
      if (!validPassword) {
        return ctx.badRequest("Invalid credentials");
      }

      const jwt = strapi.plugins["users-permissions"].services.jwt.issue({ id: user.id });

      // Get role name safely
      const roleName = user.role?.name || null;

      // Manually sanitize the user data
      const sanitizedUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        provider: user.provider,
        confirmed: user.confirmed,
        role: user.role,
      };

      ctx.send({ 
        jwt, 
        user: sanitizedUser, 
        role: roleName 
      });
    } catch (error) {
      console.error('Login error:', error);
      return ctx.badRequest(error.message || "An error occurred during login");
    }
  },
})); 