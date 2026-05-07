import { useEffect, useState } from "react";
import { changeUserPassword, getAccountBalance } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

function SettingsPage() {
  const { token, user, signOut } = useAuth();
  const { language, locale, setLanguage, t } = useI18n();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordState, setPasswordState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [balanceState, setBalanceState] = useState({
    loading: false,
    error: "",
    account: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      setBalanceState((current) => ({
        ...current,
        loading: true,
        error: "",
      }));

      try {
        const balanceData = await getAccountBalance(token);

        if (!isMounted) {
          return;
        }

        setBalanceState({
          loading: false,
          error: "",
          account: balanceData.account,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setBalanceState({
          loading: false,
          error: error.message,
          account: null,
        });
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function getInitials() {
    const fullName = `${user?.nombre || ""} ${user?.apellido || ""}`.trim();

    if (!fullName) {
      return "NB";
    }

    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  const accountIsActive = Boolean(balanceState.account) && !balanceState.error;
  const createdAtText = balanceState.account?.created_at
    ? new Date(balanceState.account.created_at).toLocaleDateString(locale)
    : "--/--/----";

  function handlePasswordInputChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function closePasswordModal() {
    setIsPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordState({
      loading: false,
      error: "",
      success: "",
    });
  }

  function closeSignOutModal() {
    setIsSignOutModalOpen(false);
  }

  function handleSignOutBackdropPointerDown(event) {
    if (event.target === event.currentTarget) {
      closeSignOutModal();
    }
  }

  function handlePasswordBackdropPointerDown(event) {
    if (event.target === event.currentTarget) {
      closePasswordModal();
    }
  }

  function confirmSignOut() {
    closeSignOutModal();
    signOut();
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordState({
        loading: false,
        error: t("settings.password.requiredFields"),
        success: "",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordState({
        loading: false,
        error: t("settings.password.minLength"),
        success: "",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordState({
        loading: false,
        error: t("settings.password.mismatch"),
        success: "",
      });
      return;
    }

    setPasswordState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      const data = await changeUserPassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordState({
        loading: false,
        error: "",
        success: data.message || t("settings.password.success"),
      });

      setTimeout(() => {
        closePasswordModal();
      }, 700);
    } catch (error) {
      setPasswordState({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  return (
    <section className="page settings-page">
      <div className="page-header settings-page-header">
        <p className="eyebrow">{t("settings.eyebrow")}</p>
        <p className="lead">{t("settings.lead")}</p>
      </div>

      <div className="settings-profile-container">
        <section className="settings-profile-section settings-profile-main">
          <div className="settings-profile-avatar">{getInitials()}</div>
          <h2 className="settings-profile-name">
            {user ? `${user.nombre} ${user.apellido}` : "Usuario"}
          </h2>
          <p className="settings-profile-email">{user?.email || "Email no disponible"}</p>

          <div className="settings-profile-divider" />

          <div className="settings-profile-status-row">
            <span
              className={`settings-profile-status-dot ${
                accountIsActive ? "settings-profile-status-dot-active" : "settings-profile-status-dot-inactive"
              }`}
            />
            <p className="settings-profile-status-text">
              {t("settings.statusPrefix")}
              <span
                className={`settings-profile-status-value ${
                  accountIsActive
                    ? "settings-profile-status-value-active"
                    : "settings-profile-status-value-inactive"
                }`}
              >
                {balanceState.loading
                  ? t("settings.statusLoading")
                  : accountIsActive
                    ? t("settings.statusActive")
                    : t("settings.statusInactive")}
              </span>
            </p>
          </div>

          <p className="settings-profile-created-at">{t("settings.createdAt", { date: createdAtText })}</p>

          {balanceState.error ? <p className="feedback feedback-error">{balanceState.error}</p> : null}
        </section>

        <section className="settings-profile-section settings-language-panel">
          <div className="settings-preference-copy">
            <h3>{t("settings.language.title")}</h3>
          </div>

          <div aria-label={t("settings.language.title")} className="settings-language-toggle" role="group">
            <button
              className={language === "ES" ? "settings-toggle-button settings-toggle-button-active" : "settings-toggle-button"}
              onClick={() => setLanguage("ES")}
              type="button"
            >
              ES
            </button>
            <button
              className={language === "EN" ? "settings-toggle-button settings-toggle-button-active" : "settings-toggle-button"}
              onClick={() => setLanguage("EN")}
              type="button"
            >
              EN
            </button>
          </div>
        </section>

        <section className="settings-profile-section settings-password-panel settings-action-panel">
          <div className="settings-preference-copy">
            <h3>{t("settings.password.title")}</h3>
          </div>

          <button className="settings-password-trigger" onClick={() => setIsPasswordModalOpen(true)} type="button">
            {t("settings.password.button")}
          </button>
        </section>

        <section className="settings-profile-section settings-signout-panel settings-action-panel">
          <div className="settings-preference-copy">
            <h3>{t("settings.signout.title")}</h3>
          </div>

          <button className="settings-password-trigger settings-signout-trigger" onClick={() => setIsSignOutModalOpen(true)} type="button">
            {t("settings.signout.button")}
          </button>
        </section>
      </div>

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

      {isPasswordModalOpen ? (
        <div
          aria-modal="true"
          className="settings-modal-backdrop"
          onPointerDown={handlePasswordBackdropPointerDown}
          role="dialog"
        >
          <section className="settings-password-modal settings-password-form-open" onClick={(event) => event.stopPropagation()}>
            <div className="settings-password-modal-header">
              <h3>{t("settings.password.title")}</h3>
              <p>{t("settings.password.subtitle")}</p>
            </div>

            <form className="settings-password-form" onSubmit={handlePasswordSubmit}>
              <label className="field">
                <span>{t("settings.password.current")}</span>
                <input
                  name="currentPassword"
                  onChange={handlePasswordInputChange}
                  type="password"
                  value={passwordForm.currentPassword}
                />
              </label>

              <label className="field">
                <span>{t("settings.password.new")}</span>
                <input
                  name="newPassword"
                  onChange={handlePasswordInputChange}
                  type="password"
                  value={passwordForm.newPassword}
                />
              </label>

              <label className="field">
                <span>{t("settings.password.confirm")}</span>
                <input
                  name="confirmPassword"
                  onChange={handlePasswordInputChange}
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>

              {passwordState.error ? <p className="feedback feedback-error">{passwordState.error}</p> : null}
              {passwordState.success ? <p className="feedback feedback-success">{passwordState.success}</p> : null}

              <div className="settings-password-actions">
                <button className="button button-primary" disabled={passwordState.loading} type="submit">
                  {passwordState.loading ? t("settings.password.saving") : t("settings.password.save")}
                </button>
                <button className="button button-secondary" disabled={passwordState.loading} onClick={closePasswordModal} type="button">
                  {t("settings.password.cancel")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default SettingsPage;
