import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import pillarIcon from "../../icons/ancient-pillar.png";
import { useAuth } from "../context/AuthContext";

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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.body.classList.add("landing-no-scroll");
    return () => {
      document.body.classList.remove("landing-no-scroll");
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
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
          <motion.h1 variants={item}>
            <span className="home-title-neo">Neo </span>
            <span className="home-title-banko">Banko</span>
          </motion.h1>
          <motion.div className="home-hero-actions" variants={item}>
            <button
              className="button button-primary home-hero-primary"
              onClick={() => navigate("/login")}
              type="button"
            >
              Acceder a Neo Banko
            </button>
            <p className="home-hero-secondary">
              ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
            </p>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
}

export default HomePage;
