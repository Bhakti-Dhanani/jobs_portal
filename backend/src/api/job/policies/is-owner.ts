export default async (policyContext, config, { strapi }) => {
  const { id } = policyContext.params;
  const user = policyContext.state.user;

  if (!user) {
    return false;
  }

  if (id) {
    // For single job operations
    const job = await strapi.entityService.findOne('api::job.job', id, {
      populate: ['user']
    });

    if (!job) {
      return false;
    }

    return job.user.id === user.id;
  } else {
    // For list operations, we'll let it through and filter in the controller
    return true;
  }
}; 