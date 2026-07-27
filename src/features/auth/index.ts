// Public API of the auth feature — import from here, not from internals.
export { useLogin, useLogout, useRegister } from './hooks/use-auth';
export type { LoginInput, RegisterInput, AuthProfile } from './types';
