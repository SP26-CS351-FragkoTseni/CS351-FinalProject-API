import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../core/auth/auth';
import type { ApiErrorBody } from '../../core/models/api.types';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const emailInvalid = touched.email && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  const passwordInvalid = touched.password && !password;

  function submit(e: FormEvent): void {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const emailOk = !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordOk = password.length > 0;
    if (!emailOk || !passwordOk || submitting) {
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    void login({ email, password })
      .then(() => {
        setSubmitting(false);
        void navigate('/tasks', { replace: true });
      })
      .catch((err: unknown) => {
        setSubmitting(false);
        const body = (err as { body?: ApiErrorBody })?.body;
        const msg =
          body?.error?.message ??
          (err instanceof Error ? err.message : null) ??
          'Login failed.';
        setErrorMessage(msg);
      });
  }

  return (
    <div className="login-page">
      <div className="card">
        <h1>Tasks &amp; Reminders</h1>
        <p className="subtitle">Sign in with your existing account.</p>

        {errorMessage ? (
          <div className="alert" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <form className="login-form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            />
            {emailInvalid ? <span className="hint">Enter a valid email.</span> : null}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            />
            {passwordInvalid ? <span className="hint">Password is required.</span> : null}
          </label>

          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
