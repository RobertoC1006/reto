import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Eye, EyeOff, ArrowRight, LockKeyhole, Mail, ArrowLeft, HeartPulse } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../app/auth';
import { Alert, BrandLeaves, Button, Field, Logo, Modal } from '../../shared/components/ui';
import { api } from '../../shared/api/services';
export default function Login() {
  const [visible, setVisible] = useState(false),
    [error, setError] = useState(''),
    [recover, setRecover] = useState(false),
    [recoveryResult, setRecoveryResult] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string; remember: boolean }>({
    defaultValues: { email: '', password: '', remember: false },
  });
  const auth = useAuth(),
    navigate = useNavigate(),
    location = useLocation();
  return (
    <main className="login-page">
      <Link to="/" className="login-back">
        <ArrowLeft size={17} /> Volver al inicio
      </Link>
      <div className="login-panel">
        <div className="login-brand">
          <Logo />
          <p>Consultorios más cerca de sus pacientes</p>
        </div>
        <div className="login-heading">
          <span className="eyebrow">TU ESPACIO DE TRABAJO</span>
          <h1>Bienvenido de nuevo</h1>
          <p>Todo listo para cuidar de tus pacientes.</p>
        </div>
        <form
          onSubmit={handleSubmit(async (values) => {
            setError('');
            try {
              await auth.login(values.email, values.password, values.remember);
              const from = location.state?.from;
              navigate(
                typeof from === 'string' && from.startsWith('/app') ? from : '/app/dashboard',
              );
            } catch (e) {
              setError((e as Error).message);
            }
          })}
        >
          <Field label="Correo electrónico" htmlFor="login-email" error={errors.email?.message}>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="nombre@consultorio.com"
                {...register('email', { required: 'Escribe tu correo electrónico.' })}
              />
            </div>
          </Field>
          <Field label="Contraseña" htmlFor="login-password" error={errors.password?.message}>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                id="login-password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                {...register('password', { required: 'Escribe tu contraseña.' })}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <div className="login-options">
            <label>
              <input type="checkbox" {...register('remember')} /> Recordarme
            </label>
            <button type="button" className="text-button" onClick={() => setRecover(true)}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          {error && <Alert>{error}</Alert>}
          <Button className="full-width" variant="teal" loading={isSubmitting}>
            Iniciar sesión <ArrowRight size={17} />
          </Button>
        </form>
        {import.meta.env.VITE_USE_MOCKS !== 'false' && (
          <div className="demo-credentials">
            <strong>Acceso de demostración</strong>
            <span>
              admin@praxia.demo <span>·</span> Praxia2026!
            </span>
          </div>
        )}
        <div className="login-illustration">
          <HeartPulse size={40} />
          <span>
            Más tiempo para tus pacientes.
            <br />
            <strong>Menos tiempo en pendientes.</strong>
          </span>
          <BrandLeaves />
        </div>
        <div className="login-footer">
          Praxia <span>·</span> Operium
        </div>
      </div>
      <Modal
        open={recover}
        onClose={() => setRecover(false)}
        title="Recuperar acceso"
        description="Escribe tu correo para solicitar la recuperación."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get('email') as string;
            try {
              await api.recover(email);
              setRecoveryResult(
                import.meta.env.VITE_USE_MOCKS !== 'false'
                  ? 'En esta demo utiliza admin@praxia.demo y Praxia2026!.'
                  : 'Si el correo está registrado, recibirás las instrucciones.',
              );
            } catch (err) {
              setRecoveryResult((err as Error).message);
            }
          }}
        >
          <Field label="Correo electrónico" htmlFor="recover-email">
            <input id="recover-email" name="email" type="email" required />
          </Field>
          {recoveryResult && <p role="status">{recoveryResult}</p>}
          <Button>Solicitar recuperación</Button>
        </form>
      </Modal>
    </main>
  );
}
