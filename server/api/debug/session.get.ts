export default defineEventHandler(async (event) => {
  const envPassword = process.env.NUXT_SESSION_PASSWORD;
  const runtimeConfig = useRuntimeConfig();
  const runtimePassword = runtimeConfig.session?.password;

  const session = await getUserSession(event);

  return {
    envPasswordSet: !!envPassword,
    envPasswordLength: envPassword?.length ?? 0,
    runtimePasswordSet: !!runtimePassword,
    runtimePasswordLength: runtimePassword?.length ?? 0,
    sessionKeys: Object.keys(session),
    sessionId: session.id,
    hasUser: !!session.user,
  };
});
