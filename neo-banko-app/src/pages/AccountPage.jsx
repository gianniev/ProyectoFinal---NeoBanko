import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BitcoinBagIcon } from "@hugeicons/core-free-icons";
import { getAccountBalance, getCryptoPortfolio } from "../api/auth";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

function getCryptoIconUrl(cmcId) {
  return cmcId ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png` : "";
}

function DashboardBalanceSkeleton({ ariaLabel }) {
  return (
    <div className="dashboard-skeleton-stack" aria-label={ariaLabel}>
      <Skeleton className="skeleton-text skeleton-w-96" />
      <Skeleton className="dashboard-skeleton-value" />
      <Skeleton className="skeleton-text skeleton-w-40" />
    </div>
  );
}

function DashboardPortfolioSkeleton({ ariaLabel }) {
  return (
    <div className="dashboard-skeleton-stack" aria-label={ariaLabel}>
      <Skeleton className="skeleton-text skeleton-w-72" />
      <Skeleton className="dashboard-skeleton-value" />
      <div className="dashboard-portfolio-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="dashboard-portfolio-row" key={index}>
            <div className="dashboard-skeleton-row">
              <Skeleton className="dashboard-skeleton-icon" />
              <div className="dashboard-skeleton-name">
                <Skeleton className="skeleton-text skeleton-w-40" />
                <Skeleton className="skeleton-text skeleton-w-72" />
              </div>
            </div>
            <Skeleton className="skeleton-text skeleton-w-88" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountPage() {
  const { token } = useAuth();
  const { locale, t } = useI18n();
  const [visibleBalances, setVisibleBalances] = useState({
    fiat: true,
    crypto: true,
  });
  const [balanceState, setBalanceState] = useState({
    loading: true,
    error: "",
    account: null,
  });
  const [portfolioState, setPortfolioState] = useState({
    loading: true,
    error: "",
    portfolio: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const [balanceData, portfolioData] = await Promise.all([
          getAccountBalance(token),
          getCryptoPortfolio(token),
        ]);

        if (!isMounted) {
          return;
        }

        setBalanceState({
          loading: false,
          error: "",
          account: balanceData.account,
        });

        setPortfolioState({
          loading: false,
          error: "",
          portfolio: portfolioData.portfolio || [],
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
        setPortfolioState({
          loading: false,
          error: error.message,
          portfolio: [],
        });
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const balanceValue = balanceState.account
    ? Number(balanceState.account.balance).toLocaleString(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";

  const cryptoPortfolioValue = portfolioState.portfolio.reduce(
    (total, item) => total + (Number(item.amount || 0) * Number(item.current_price || 0)),
    0
  );
  const cryptoPortfolioValueText = cryptoPortfolioValue.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function toggleBalance(type) {
    setVisibleBalances((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  return (
    <section className="page dashboard-hero">
      <div className="page-header dashboard-hero-header">
        <p className="eyebrow">{t("account.eyebrow")}</p>
        <h1>{t("account.title")}</h1>
        <p className="lead">{t("account.lead")}</p>
      </div>

      <div className="dashboard-toggle-group" aria-label={t("account.toggleAria")}>
        <button
          className={visibleBalances.fiat ? "dashboard-toggle dashboard-toggle-active" : "dashboard-toggle"}
          onClick={() => toggleBalance("fiat")}
          type="button"
        >
          {t("account.euros")}
        </button>
        <button
          className={visibleBalances.crypto ? "dashboard-toggle dashboard-toggle-active" : "dashboard-toggle"}
          onClick={() => toggleBalance("crypto")}
          type="button"
        >
          {t("account.crypto")}
        </button>
      </div>

      <div className="dashboard-balance-card">
        {visibleBalances.fiat ? (
          <div className="dashboard-balance-col dashboard-fiat-col">
            {balanceState.loading ? (
              <DashboardBalanceSkeleton ariaLabel={t("account.loadingBalanceAria")} />
            ) : (
              <>
                <p className="dashboard-balance-label">{t("account.availableBalance")}</p>
                <strong className="dashboard-balance-value">{balanceValue} {"\u20ac"}</strong>
              </>
            )}
          </div>
        ) : null}

        {visibleBalances.crypto ? (
          <div className="dashboard-balance-col dashboard-crypto-col">
            {portfolioState.loading ? (
              <DashboardPortfolioSkeleton ariaLabel={t("account.loadingPortfolioAria")} />
            ) : (
              <>
                <p className="dashboard-balance-label dashboard-balance-label-with-icon">
                  <HugeiconsIcon icon={BitcoinBagIcon} size={14} strokeWidth={1.8} />
                  <span>{t("account.portfolio")}</span>
                </p>
                <strong className="dashboard-balance-value">{cryptoPortfolioValueText} {"\u20ac"}</strong>
              </>
            )}
            {!portfolioState.loading && portfolioState.portfolio.length === 0 ? (
              <span className="dashboard-balance-currency">{t("account.noBuys")}</span>
            ) : null}
            {!portfolioState.loading && portfolioState.portfolio.length > 0 ? (
              <div className="dashboard-portfolio-list">
                {portfolioState.portfolio.map((item) => (
                  <div className="dashboard-portfolio-row" key={item.crypto_id || item.id}>
                    <div className="dashboard-portfolio-asset">
                      {item.cmc_id ? (
                        <img
                          alt=""
                          aria-hidden="true"
                          className="dashboard-portfolio-icon"
                          src={getCryptoIconUrl(item.cmc_id)}
                        />
                      ) : (
                        <span className="dashboard-portfolio-icon-fallback">{item.symbol.slice(0, 1)}</span>
                      )}
                      <div>
                        <strong>{item.symbol}</strong>
                        <p className="dashboard-portfolio-name">{item.name}</p>
                      </div>
                    </div>
                    <span>
                      {Number(item.amount).toLocaleString(locale, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {item.symbol}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="dashboard-account-note">
        <span>{"\u2022"}</span>
        {balanceState.account
          ? t("account.accountNumber", { accountNumber: balanceState.account.account_number })
          : t("account.accountUnavailable")}
        <span>{"\u2022"}</span>
      </p>

      {balanceState.error ? (
        <p className="feedback feedback-error">
          {balanceState.error}
        </p>
      ) : null}
      {portfolioState.error && !balanceState.error ? (
        <p className="feedback feedback-error">
          {portfolioState.error}
        </p>
      ) : null}
    </section>
  );
}

export default AccountPage;
