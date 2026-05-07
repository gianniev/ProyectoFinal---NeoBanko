import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import pillarIcon from "../../icons/ancient-pillar.png";
import { useAuth } from "../context/AuthContext";
import { getGoogleAuthUrl, registerUser } from "../api/auth";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [activePanel, setActivePanel] = useState(null);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loginStatus, setLoginStatus] = useState({
    loading: false,
    error: "",
  });
  const [registerData, setRegisterData] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [registerStatus, setRegisterStatus] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    document.body.classList.add("landing-no-scroll");
    return () => {
      document.body.classList.remove("landing-no-scroll");
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  function handleLoginChange(event) {
    const { name, value } = event.target;
    setLoginData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleInlineLogin(event) {
    event.preventDefault();
    setLoginStatus({ loading: true, error: "" });

    try {
      await signIn(loginData);
      navigate("/dashboard");
    } catch (error) {
      setLoginStatus({ loading: false, error: error.message });
      return;
    }

    setLoginStatus({ loading: false, error: "" });
  }

  function handleRegisterChange(event) {
    const { name, value } = event.target;
    setRegisterData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleInlineRegister(event) {
    event.preventDefault();
    setRegisterStatus({ loading: true, error: "", success: "" });

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterStatus({
        loading: false,
        error: "Las contrasenas no coinciden",
        success: "",
      });
      return;
    }

    try {
      const { confirmPassword, ...payload } = registerData;
      const data = await registerUser(payload);
      setRegisterStatus({
        loading: false,
        error: "",
        success: data.message || "Registro completado correctamente",
      });
      setRegisterData({
        dni: "",
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      window.setTimeout(() => {
        setActivePanel("login");
      }, 900);
    } catch (error) {
      setRegisterStatus({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  function closeModal() {
    setActivePanel(null);
  }

  function handleBackdropPointerDown(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  return (
    <>
    <section className="hero">
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className="home-hero-icon-wrap"
        initial={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <img alt="" aria-hidden="true" className="home-hero-icon" src={pillarIcon} />
      </motion.div>

      <motion.div
        animate="show"
        className="hero-copy home-hero-copy"
        initial="hidden"
        variants={container}
      >
        <div className="home-hero-main">
          <motion.div aria-hidden="true" className="home-hero-line" variants={item} />
          <motion.p className="eyebrow" variants={item}>Proyecto Final</motion.p>
          <motion.h1 variants={item}>
            <span className="home-title-neo">Neo </span>
            <span className="home-title-banko">Banko</span>
          </motion.h1>
          <motion.div className="actions" variants={item}>
            <button
              className="button button-primary"
              onClick={() => {
                setLoginStatus({ loading: false, error: "" });
                setActivePanel("register");
              }}
              type="button"
            >
              Crear cuenta
            </button>
            <button
              className="button button-secondary home-login-button"
              onClick={() => {
                setRegisterStatus((current) => ({ ...current, error: "", success: "" }));
                setActivePanel("login");
              }}
              type="button"
            >
              Iniciar sesion
            </button>
          </motion.div>
        </div>

      </motion.div>
    </section>

    <AnimatePresence mode="wait">
      {activePanel ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="home-modal-backdrop"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onPointerDown={handleBackdropPointerDown}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="home-modal"
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <button
              aria-label="Cerrar"
              className="home-modal-close"
              onClick={closeModal}
              type="button"
            >
              x
            </button>

            {activePanel === "login" ? (
              <form className="form-card home-inline-login auth-login-form" onSubmit={handleInlineLogin}>
                <div className="home-modal-header">
                  <p className="eyebrow">Acceso</p>
                  <h2>Iniciar sesion</h2>
                </div>

                <label className="field">
                  <span>Email</span>
                  <input
                    name="email"
                    onChange={handleLoginChange}
                    placeholder="tu@email.com"
                    type="email"
                    value={loginData.email}
                  />
                </label>

                <label className="field">
                  <span>Contrasena</span>
                  <input
                    name="password"
                    onChange={handleLoginChange}
                    placeholder="******"
                    type="password"
                    value={loginData.password}
                  />
                </label>

                {loginStatus.error ? <p className="feedback feedback-error">{loginStatus.error}</p> : null}

                <button className="button button-primary auth-submit-button" disabled={loginStatus.loading} type="submit">
                  {loginStatus.loading ? "Entrando..." : "Entrar"}
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
              </form>
            ) : null}

            {activePanel === "register" ? (
              <form className="form-card form-grid home-inline-login home-inline-register" onSubmit={handleInlineRegister}>
                <div className="home-modal-header field-full">
                  <p className="eyebrow">Registro</p>
                  <h2>Crear cuenta</h2>
                </div>

                <label className="field">
                  <span>DNI</span>
                  <input
                    name="dni"
                    onChange={handleRegisterChange}
                    placeholder="12345678A"
                    type="text"
                    value={registerData.dni}
                  />
                </label>
                <label className="field">
                  <span>Nombre</span>
                  <input
                    name="nombre"
                    onChange={handleRegisterChange}
                    placeholder="Nombre"
                    type="text"
                    value={registerData.nombre}
                  />
                </label>
                <label className="field">
                  <span>Apellido</span>
                  <input
                    name="apellido"
                    onChange={handleRegisterChange}
                    placeholder="Apellido"
                    type="text"
                    value={registerData.apellido}
                  />
                </label>
                <label className="field">
                  <span>Telefono</span>
                  <input
                    name="telefono"
                    onChange={handleRegisterChange}
                    placeholder="+34 600 000 000"
                    type="text"
                    value={registerData.telefono}
                  />
                </label>
                <label className="field field-full">
                  <span>Email</span>
                  <input
                    name="email"
                    onChange={handleRegisterChange}
                    placeholder="tu@email.com"
                    type="email"
                    value={registerData.email}
                  />
                </label>
                <label className="field">
                  <span>Contrasena</span>
                  <input
                    name="password"
                    onChange={handleRegisterChange}
                    placeholder="Minimo 6 caracteres"
                    type="password"
                    value={registerData.password}
                  />
                </label>
                <label className="field">
                  <span>Confirmar contrasena</span>
                  <input
                    name="confirmPassword"
                    onChange={handleRegisterChange}
                    placeholder="Repite tu contrasena"
                    type="password"
                    value={registerData.confirmPassword}
                  />
                </label>

                {registerStatus.error ? (
                  <p className="feedback feedback-error field-full">{registerStatus.error}</p>
                ) : null}
                {registerStatus.success ? (
                  <p className="feedback feedback-success field-full">{registerStatus.success}</p>
                ) : null}

                <button className="button button-primary field-full" disabled={registerStatus.loading} type="submit">
                  {registerStatus.loading ? "Registrando..." : "Crear cuenta"}
                </button>
              </form>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    </>
  );
}

export default HomePage;
