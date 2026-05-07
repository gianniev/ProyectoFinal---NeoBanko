import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import pillarIcon from "../../icons/ancient-pillar.png";

function Layout() {
  const { isAuthenticated, signOut, user } = useAuth();
  const { t } = useI18n();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const sessionDisplayName = [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim();

  const navItems = [
    { to: "/dashboard", label: t("layout.nav.dashboard") },
    { to: "/transacciones", label: t("layout.nav.transactions") },
    { to: "/crypto", label: t("layout.nav.crypto") },
    { to: "/configuracion", label: t("layout.nav.settings") },
  ];

  const closeSignOutModal = () => setIsSignOutModalOpen(false);
  const handleSignOutBackdropPointerDown = (event) => {
    if (event.target === event.currentTarget) {
      closeSignOutModal();
    }
  };

  const confirmSignOut = () => {
    closeSignOutModal();
    signOut();
  };

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <img alt="" aria-hidden="true" className="brand-icon" src={pillarIcon} />
          Neo Banko
        </a>

        {isAuthenticated ? (
          <>
            <nav className="nav">
              {navItems.map((item) => (
                <NavLink
                  className={({ isActive }) => (isActive ? "nav-link nav-link-active" : "nav-link")}
                  end={item.to === "/dashboard"}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="session-box">
              <div className="session-user">
                {user?.avatar_url ? (
                  <img alt="" aria-hidden="true" className="session-avatar" src={user.avatar_url} />
                ) : (
                  <span className="session-avatar-fallback">
                    {user?.nombre?.slice(0, 1)?.toUpperCase() || "N"}
                  </span>
                )}
                <span className="session-text">{sessionDisplayName || t("layout.sessionActive")}</span>
              </div>
              <button
                className="button button-secondary button-small"
                onClick={() => setIsSignOutModalOpen(true)}
                type="button"
              >
                {t("layout.signOut")}
              </button>
            </div>
          </>
        ) : null}
      </header>

      <main className="content">
        <Outlet />
      </main>

      {isSignOutModalOpen ? (
        <div
          aria-modal="true"
          className="home-modal-backdrop"
          onPointerDown={handleSignOutBackdropPointerDown}
          role="dialog"
        >
          <section className="home-modal signout-modal" onClick={(event) => event.stopPropagation()}>
            <div className="home-modal-header">
              <h2>{t("layout.signOutModal.title")}</h2>
              <p className="lead">{t("layout.signOutModal.message")}</p>
            </div>

            <div className="signout-modal-actions">
              <button className="button button-secondary" onClick={closeSignOutModal} type="button">
                {t("layout.signOutModal.cancel")}
              </button>
              <button className="button button-primary" onClick={confirmSignOut} type="button">
                {t("layout.signOutModal.confirm")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default Layout;
