import { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, signInWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      signInWithToken(token);
      navigate("/dashboard", { replace: true });
      return;
    }

    if (error) {
      navigate("/login", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  }, [navigate, searchParams, signInWithToken]);

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <section className="page page-loading" aria-busy="true">
      <p className="muted-copy">Validando acceso con Google...</p>
    </section>
  );
}

export default GoogleAuthCallbackPage;
