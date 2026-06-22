import { setButtonState, setMessage } from './access-ui.js';

export function createVisitorAccess({ strings, startVisitorSession, deviceId, onSession }) {
  return {
    async submit(passkey, { button, errorElement }) {
      if (!passkey) return null;

      setButtonState(button, {
        disabled: true,
        text: strings.auth.verifying,
      });
      setMessage(errorElement, '');

      try {
        const session = await startVisitorSession(passkey, deviceId);
        onSession?.(session);
        return session;
      } catch (error) {
        setMessage(errorElement, error.message || strings.auth.networkError);
        return null;
      } finally {
        setButtonState(button, {
          disabled: false,
          text: strings.auth.verifyUnlock,
        });
      }
    },
  };
}
