import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v.trim());

function validate(mode, f) {
  const e = {};
  if (mode === 'signup' && f.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
  if (!f.email.trim()) e.email = 'Email is required';
  else if (!emailOk(f.email)) e.email = 'Enter a valid email address';
  if (!f.password) e.password = 'Password is required';
  else if (mode === 'signup' && f.password.length < 8) e.password = 'Password must be at least 8 characters';
  if (mode === 'signup' && f.confirm !== f.password) e.confirm = 'Passwords do not match';
  return e;
}

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/dashboard'} replace />;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const switchMode = (next) => {
    setMode(next);
    setErrors({});
    setServerError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(mode, form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      if (mode === 'login') await login({ email: form.email.trim(), password: form.password });
      else await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      // On success the user state changes and the <Navigate> above redirects.
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...err.errors }));
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="auth-page">
      <button type="button" className="btn btn-small btn-ghost auth-theme" onClick={toggle} aria-label="Toggle dark mode">
        {theme === 'dark' ? '☀ Light' : '☾ Dark'}
      </button>
      <div className="card auth-card">
        <h1>Personal Finance Tracker</h1>
        <p className="muted">{isSignup ? 'Create your account to start tracking.' : 'Log in to see your finances.'}</p>

        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? 'tab tab-active' : 'tab'} onClick={() => switchMode('login')}>
            Log in
          </button>
          <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? 'tab tab-active' : 'tab'} onClick={() => switchMode('signup')}>
            Sign up
          </button>
        </div>

        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          {isSignup && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
            {isSignup && !errors.password && <span className="field-hint">At least 8 characters.</span>}
          </div>
          {isSignup && (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} aria-invalid={Boolean(errors.confirm)} />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
