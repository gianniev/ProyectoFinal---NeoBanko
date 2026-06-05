import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
        <path
          d="M1.5 12s3.5-6.5 10.5-6.5S22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <circle cx="12" cy="12" fill="none" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M3 3l18 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M10.6 6.2c.5-.1.9-.2 1.4-.2 7 0 10.5 6 10.5 6a18.5 18.5 0 0 1-4.1 4.8M6.5 9.4A18.6 18.6 0 0 0 1.5 12s3.5 6.5 10.5 6.5c1.1 0 2.2-.2 3.1-.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    if (formData.password !== formData.confirmPassword) {
      setStatus({
        loading: false,
        error: "Las contrasenas no coinciden",
        success: "",
      });
      return;
    }

    try {
      const { confirmPassword, ...payload } = formData;
      const data = await registerUser(payload);
      setStatus({
        loading: false,
        error: "",
        success: data.message || "Registro completado correctamente",
      });

      setFormData({
        dni: "",
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      window.setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  return (
    <section className="page auth-page">
      <div className="page-header">
        <p className="eyebrow">Alta de usuario</p>
        <h1>Crear cuenta</h1>
        <p className="lead">
          Formulario inicial preparado para el flujo de registro.
        </p>
      </div>

      <form className="card form-card form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>DNI</span>
          <input
            name="dni"
            onChange={handleChange}
            placeholder="12345678A"
            type="text"
            value={formData.dni}
          />
        </label>

        <label className="field">
          <span>Nombre</span>
          <input
            name="nombre"
            onChange={handleChange}
            placeholder="Gianni"
            type="text"
            value={formData.nombre}
          />
        </label>

        <label className="field">
          <span>Apellido</span>
          <input
            name="apellido"
            onChange={handleChange}
            placeholder="Etcheverry"
            type="text"
            value={formData.apellido}
          />
        </label>

        <label className="field">
          <span>Telefono</span>
          <input
            name="telefono"
            onChange={handleChange}
            placeholder="+34 600 000 000"
            type="text"
            value={formData.telefono}
          />
        </label>

        <label className="field field-full">
          <span>Email</span>
          <input
            name="email"
            onChange={handleChange}
            placeholder="tu@email.com"
            type="email"
            value={formData.email}
          />
        </label>

        <label className="field field-full">
          <span>Contrasena</span>
          <div className="password-field">
            <input
              name="password"
              onChange={handleChange}
              placeholder="Minimo 6 caracteres"
              type={showPassword ? "text" : "password"}
              value={formData.password}
            />
            <button
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </label>

        <label className="field field-full">
          <span>Confirmar contrasena</span>
          <div className="password-field">
            <input
              name="confirmPassword"
              onChange={handleChange}
              placeholder="Repite tu contrasena"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
            />
            <button
              aria-label={showConfirmPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
              className="password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              type="button"
            >
              <EyeIcon visible={showConfirmPassword} />
            </button>
          </div>
        </label>

        {status.error ? <p className="feedback feedback-error field-full">{status.error}</p> : null}
        {status.success ? (
          <p className="feedback feedback-success field-full">{status.success}</p>
        ) : null}

        <button className="button button-primary field-full" disabled={status.loading} type="submit">
          {status.loading ? "Registrando..." : "Registrarme"}
        </button>

        <p className="auth-switch field-full">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
        </p>
      </form>
    </section>
  );
}

export default RegisterPage;
