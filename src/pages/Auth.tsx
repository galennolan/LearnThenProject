import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Field, TextInput } from '../components/ui';
import { useToast } from '../hooks/useToast';

export function LoginPage() {
  const { signIn } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) {
      setErr('Email dan kata sandi wajib diisi.');
      return;
    }
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    push('Berhasil masuk. Selamat belajar!');
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-slate-900">OutputLab</h1>
      <p className="mt-1 text-sm text-slate-500">Ubah materi belajar menjadi output nyata.</p>
      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Masuk</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" />
          </Field>
          <Field label="Kata sandi">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Belum punya akun?{' '}
          <Link to="/daftar" className="font-medium text-slate-900 underline">
            Daftar
          </Link>
        </p>
      </Card>
    </div>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!email || password.length < 6) {
      setErr('Email wajib diisi dan kata sandi minimal 6 karakter.');
      return;
    }
    setBusy(true);
    const { error } = await signUp(email.trim(), password);
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    push('Akun dibuat. Silakan masuk.');
    navigate('/masuk', { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-slate-900">OutputLab</h1>
      <p className="mt-1 text-sm text-slate-500">Mulai sistem belajar-menghasilkan output.</p>
      <Card className="mt-6">
        <h2 className="text-lg font-semibold">Daftar</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete="email" />
          </Field>
          <Field label="Kata sandi" hint="Minimal 6 karakter">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Memproses...' : 'Buat akun'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/masuk" className="font-medium text-slate-900 underline">
            Masuk
          </Link>
        </p>
      </Card>
    </div>
  );
}
