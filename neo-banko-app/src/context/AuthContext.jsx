import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser } from "../api/auth";

const AUTH_STORAGE_KEY = "neo-banko-auth";
const AuthContext = createContext(null);

function readStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return { token: "", user: null };
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(readStoredAuth().token));

  useEffect(() => {
    if (!auth.token) {
      setIsBootstrapping(false);
      return;
    }

    let isMounted = true;

    getCurrentUser(auth.token)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const nextAuth = {
          token: auth.token,
          user: data.user,
        };

        setAuth(nextAuth);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setAuth({ token: "", user: null });
        localStorage.removeItem(AUTH_STORAGE_KEY);
      })
      .finally(() => {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auth.token]);

  async function signIn(credentials) {
    const data = await loginUser(credentials);
    const nextAuth = {
      token: data.token,
      user: data.user,
    };

    setAuth(nextAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
    return data;
  }

  function signInWithToken(token) {
    const nextAuth = {
      token,
      user: null,
    };

    setAuth(nextAuth);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
  }

  function signOut() {
    logoutUser().catch(() => {});
    setAuth({ token: "", user: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        token: auth.token,
        user: auth.user,
        isAuthenticated: Boolean(auth.token),
        isBootstrapping,
        signIn,
        signInWithToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
