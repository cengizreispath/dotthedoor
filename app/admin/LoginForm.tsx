'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="adm-login">
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      <button className="primary" disabled={pending}>Sign in</button>
      {error && <p className="pub-error" role="alert">{error}</p>}
    </form>
  );
}
