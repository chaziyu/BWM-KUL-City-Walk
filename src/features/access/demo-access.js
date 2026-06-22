export function createDemoAccess({ startDemoSession, onSession }) {
  return {
    async start() {
      const session = await startDemoSession();
      onSession?.(session);
      return session;
    },
  };
}
