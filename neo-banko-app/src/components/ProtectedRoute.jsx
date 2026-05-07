import { Navigate } from "react-router-dom";
import { SpinnerCustom } from "./Spinner";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <section className="page-loading" aria-busy="true">
        <SpinnerCustom />
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return children;
}

export default ProtectedRoute;
