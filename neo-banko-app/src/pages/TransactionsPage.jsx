import { useEffect, useState } from "react";
import { createTransfer, getAccountBalance, getTransactionHistory } from "../api/auth";
import ProcessingItem from "../components/ProcessingItem";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

function TransactionsHistorySkeleton({ ariaLabel }) {
  return (
    <div className="transactions-list" aria-label={ariaLabel}>
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="transactions-row transactions-row-skeleton" key={index}>
          <div className="transactions-skeleton-copy">
            <Skeleton className="skeleton-text skeleton-w-88" />
            <Skeleton className="skeleton-text skeleton-w-120" />
            <Skeleton className="skeleton-text skeleton-w-96" />
          </div>
          <div className="transactions-meta transactions-skeleton-meta">
            <Skeleton className="skeleton-text skeleton-w-88" />
            <Skeleton className="skeleton-text skeleton-w-160" />
          </div>
        </article>
      ))}
    </div>
  );
}

function TransferFormSkeleton({ ariaLabel }) {
  return (
    <div className="card form-card form-grid transfer-form transactions-form transactions-form-skeleton" aria-label={ariaLabel}>
      <div className="field field-full">
        <Skeleton className="skeleton-label" />
        <Skeleton className="skeleton-input" />
      </div>
      <div className="field">
        <Skeleton className="skeleton-label" />
        <Skeleton className="skeleton-input" />
      </div>
      <div className="field">
        <Skeleton className="skeleton-label" />
        <Skeleton className="skeleton-input" />
      </div>
      <Skeleton className="skeleton-button field-full" />
    </div>
  );
}

function TransactionsPanelSkeleton({ ariaLabel, historyAriaLabel }) {
  return (
    <section className="card transactions-history transactions-history-panel" aria-label={ariaLabel}>
      <Skeleton className="transactions-title-skeleton" />
      <TransactionsHistorySkeleton ariaLabel={historyAriaLabel} />
    </section>
  );
}

function TransactionsPage() {
  const { token } = useAuth();
  const { locale, t } = useI18n();
  const [transferData, setTransferData] = useState({
    toIdentifier: "",
    amount: "",
    description: "",
  });
  const [transferState, setTransferState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [historyState, setHistoryState] = useState({
    loading: true,
    error: "",
    transactions: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const data = await getTransactionHistory(token);

        if (!isMounted) {
          return;
        }

        setHistoryState({
          loading: false,
          error: "",
          transactions: data.transactions || [],
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHistoryState({
          loading: false,
          error: error.message,
          transactions: [],
        });
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [token]);

  function handleTransferChange(event) {
    const { name, value } = event.target;
    setTransferData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleTransferSubmit(event) {
    event.preventDefault();
    setTransferState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      const payload = {
        ...transferData,
        amount: Number(transferData.amount),
      };

      const data = await createTransfer(token, payload);
      await Promise.all([getAccountBalance(token), refreshHistory()]);

      setTransferData({
        toIdentifier: "",
        amount: "",
        description: "",
      });

      setTransferState({
        loading: false,
        error: "",
        success: data.message || t("transactions.transferSuccess"),
      });
    } catch (error) {
      setTransferState({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  async function refreshHistory() {
    const historyData = await getTransactionHistory(token);
    setHistoryState({
      loading: false,
      error: "",
      transactions: historyData.transactions || [],
    });
  }

  function formatDate(value) {
    return new Date(value).toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="page transactions-page">
      <div className="page-header transactions-header">
        <p className="eyebrow">{t("transactions.eyebrow")}</p>
        <p className="lead">{t("transactions.lead")}</p>
      </div>

      {historyState.loading ? (
        <>
          <TransferFormSkeleton ariaLabel={t("transactions.loadingFormAria")} />
          <TransactionsPanelSkeleton
            ariaLabel={t("transactions.loadingPanelAria")}
            historyAriaLabel={t("transactions.loadingHistoryAria")}
          />
        </>
      ) : (
        <>
          <form className="card form-card form-grid transfer-form transactions-form" onSubmit={handleTransferSubmit}>
            <label className="field field-full">
              <span>{t("transactions.recipient")}</span>
              <input
                name="toIdentifier"
                onChange={handleTransferChange}
                placeholder={t("transactions.recipientPlaceholder")}
                type="text"
                value={transferData.toIdentifier}
              />
            </label>

            <label className="field">
              <span>{t("transactions.amount")}</span>
              <input
                min="0"
                name="amount"
                onChange={handleTransferChange}
                placeholder="0.00"
                step="0.01"
                type="number"
                value={transferData.amount}
              />
            </label>

            <label className="field">
              <span>{t("transactions.concept")}</span>
              <input
                name="description"
                onChange={handleTransferChange}
                placeholder={t("transactions.conceptPlaceholder")}
                type="text"
                value={transferData.description}
              />
            </label>

            {transferState.error ? (
              <p className="feedback feedback-error field-full">{transferState.error}</p>
            ) : null}
            {transferState.success ? (
              <p className="feedback feedback-success field-full">{transferState.success}</p>
            ) : null}

            {transferState.loading ? (
              <div className="field-full">
                <ProcessingItem
                  amount={transferData.amount ? `${Number(transferData.amount).toFixed(2)} ${t("transactions.currencyCode")}` : ""}
                  title={t("transactions.processing")}
                />
              </div>
            ) : null}

            <button className="button button-primary field-full" disabled={transferState.loading} type="submit">
              {t("transactions.submit")}
            </button>
          </form>

          <section className="card transactions-history transactions-history-panel">
            <h2>{t("transactions.historyTitle")}</h2>
            {historyState.error ? <p className="feedback feedback-error">{historyState.error}</p> : null}

            {historyState.transactions.length === 0 ? (
              <p className="muted-copy">{t("transactions.empty")}</p>
            ) : null}

            {historyState.transactions.length > 0 ? (
              <div className="transactions-list">
                {historyState.transactions.map((tx) => (
                  <article className="transactions-row" key={tx.id}>
                    <div>
                      <strong>{tx.direction === "sent" ? t("transactions.sent") : t("transactions.received")}</strong>
                      <p>{tx.description || t("transactions.defaultDescription")}</p>
                      <p>{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="transactions-meta">
                      <span>
                        {tx.direction === "sent"
                          ? `- ${tx.amount.toFixed(2)} ${t("transactions.currencyCode")}`
                          : `+ ${tx.amount.toFixed(2)} ${t("transactions.currencyCode")}`}
                      </span>
                      <p>
                        {tx.direction === "sent"
                          ? t("transactions.to", { name: tx.to_name, account: tx.to_account_number })
                          : t("transactions.from", { name: tx.from_name, account: tx.from_account_number })}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </>
      )}
    </section>
  );
}

export default TransactionsPage;
