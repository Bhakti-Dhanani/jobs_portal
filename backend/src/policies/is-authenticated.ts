export default (policyContext: any, config: any, { strapi }: any) => {
  if (policyContext.state.user) {
    return true;
  }

  return false;
}; 