import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getGoogleAuthUrl } from "../api/auth";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: "",
  });

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });

    try {
      await signIn(formData);
      navigate("/dashboard");
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
      });
      return;
    }

    setStatus({ loading: false, error: "" });
  }

  return (
    <section className="page auth-page">
      <div className="page-header">
        <p className="eyebrow">Acceso</p>
        <h1>Iniciar sesion</h1>
        <p className="lead">Accede con tu cuenta real del backend.</p>
      </div>

      <form className="card form-card auth-login-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            onChange={handleChange}
            placeholder="tu@email.com"
            type="email"
            value={formData.email}
          />
        </label>

        <label className="field">
          <span>Contrasena</span>
          <input
            name="password"
            onChange={handleChange}
            placeholder="******"
            type="password"
            value={formData.password}
          />
        </label>

        {status.error ? <p className="feedback feedback-error">{status.error}</p> : null}

        <button className="button button-primary auth-submit-button" disabled={status.loading} type="submit">
          {status.loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="auth-separator" aria-hidden="true">
          <span className="auth-separator-line" />
          <span className="auth-separator-copy">o</span>
          <span className="auth-separator-line" />
        </div>

        <a className="button button-secondary auth-google-button" href={getGoogleAuthUrl()}>
          <svg aria-hidden="true" className="auth-google-icon" viewBox="0 0 24 24">
            <path
              d="M22.5 12.227c0-.818-.073-1.604-.209-2.364H12v4.472h5.895a5.043 5.043 0 0 1-2.188 3.308v2.744h3.534c2.068-1.904 3.259-4.715 3.259-8.16Z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.984 7.28-2.613l-3.534-2.744c-.984.66-2.244 1.05-3.746 1.05-2.878 0-5.316-1.943-6.185-4.553H2.16v2.831A10.999 10.999 0 0 0 12 23Z"
              fill="#34A853"
            />
            <path
              d="M5.815 14.14a6.617 6.617 0 0 1 0-4.28V7.028H2.16a11 11 0 0 0 0 9.944l3.655-2.832Z"
              fill="#FBBC04"
            />
            <path
              d="M12 5.307c1.615 0 3.066.555 4.208 1.644l3.154-3.154C17.454 2.036 14.964 1 12 1A11 11 0 0 0 2.16 7.028l3.655 2.832c.869-2.61 3.307-4.553 6.185-4.553Z"
              fill="#EA4335"
            />
          </svg>
          Iniciar sesion con Google
        </a>

        <p className="auth-switch">
          ¿Aun no tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
