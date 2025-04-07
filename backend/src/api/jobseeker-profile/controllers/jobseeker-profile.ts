import { factories } from '@strapi/strapi';

interface JobseekerProfileData {
  firstName: string;
  lastName: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  user: number;
}

interface JobseekerProfileContext {
  state: {
    user: {
      id: number;
      role: string;
    };
  };
  request: {
    body: {
      data: JobseekerProfileData;
    };
  };
  params: {
    id: string;
  };
  unauthorized: (message: string) => void;
  forbidden: (message: string) => void;
  notFound: (message: string) => void;
  badRequest: (message: string) => void;
  internalServerError: (message: string) => void;
}

interface JobseekerProfileEntity {
  id: number;
  attributes: {
    firstName: string;
    lastName: string;
    phone: string;
    skills: any;
    experience: string;
    education: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
  user: {
    id: number;
    attributes: any;
  };
}

export default factories.createCoreController('api::jobseeker-profile.jobseeker-profile', ({ strapi }) => ({
  async find(ctx: any) {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to view profiles');
      }

      const profiles = await strapi.entityService.findMany('api::jobseeker-profile.jobseeker-profile', {
        populate: ['user'],
        filters: {
          user: {
            id: user.id
          }
        }
      });

      return { data: profiles };
    } catch (err) {
      console.error('Error in find:', err);
      return ctx.internalServerError('An error occurred while fetching profiles');
    }
  },

  async findOne(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to view profiles');
      }

      const profile = await strapi.entityService.findOne('api::jobseeker-profile.jobseeker-profile', id, {
        populate: ['user']
      }) as unknown as JobseekerProfileEntity;

      if (!profile) {
        return ctx.notFound('Profile not found');
      }

      // Only allow users to view their own profile
      if (profile.user.id !== user.id && user.role !== 'admin') {
        return ctx.forbidden('You can only view your own profile');
      }

      return { data: profile };
    } catch (err) {
      console.error('Error in findOne:', err);
      return ctx.internalServerError('An error occurred while fetching the profile');
    }
  },

  async create(ctx: any) {
    try {
      const { user } = ctx.state;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in to create a profile');
      }

      if (user.role !== 'jobseeker') {
        return ctx.forbidden('Only jobseekers can create profiles');
      }

      // Check if profile already exists
      const existingProfile = await strapi.entityService.findMany('api::jobseeker-profile.jobseeker-profile', {
        filters: {
          user: {
            id: user.id
          }
        }
      });

      if (existingProfile.length > 0) {
        return ctx.badRequest('Profile already exists for this user');
      }

      const profile = await strapi.entityService.create('api::jobseeker-profile.jobseeker-profile', {
        data: {
          ...ctx.request.body.data,
          user: user.id
        }
      });

      return { data: profile };
    } catch (err) {
      console.error('Error in create:', err);
      return ctx.internalServerError('An error occurred while creating the profile');
    }
  },

  async update(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to update a profile');
      }

      const profile = await strapi.entityService.findOne('api::jobseeker-profile.jobseeker-profile', id, {
        populate: ['user']
      }) as unknown as JobseekerProfileEntity;

      if (!profile) {
        return ctx.notFound('Profile not found');
      }

      // Only allow users to update their own profile
      if (profile.user.id !== user.id && user.role !== 'admin') {
        return ctx.forbidden('You can only update your own profile');
      }

      const updatedProfile = await strapi.entityService.update('api::jobseeker-profile.jobseeker-profile', id, {
        data: ctx.request.body.data
      });

      return { data: updatedProfile };
    } catch (err) {
      console.error('Error in update:', err);
      return ctx.internalServerError('An error occurred while updating the profile');
    }
  },

  async delete(ctx: any) {
    try {
      const { id } = ctx.params;
      const { user } = ctx.state;

      if (!user) {
        return ctx.unauthorized('You must be logged in to delete a profile');
      }

      const profile = await strapi.entityService.findOne('api::jobseeker-profile.jobseeker-profile', id, {
        populate: ['user']
      }) as unknown as JobseekerProfileEntity;

      if (!profile) {
        return ctx.notFound('Profile not found');
      }

      // Only allow users to delete their own profile
      if (profile.user.id !== user.id && user.role !== 'admin') {
        return ctx.forbidden('You can only delete your own profile');
      }

      const deletedProfile = await strapi.entityService.delete('api::jobseeker-profile.jobseeker-profile', id);

      return { data: deletedProfile };
    } catch (err) {
      console.error('Error in delete:', err);
      return ctx.internalServerError('An error occurred while deleting the profile');
    }
  }
})); 