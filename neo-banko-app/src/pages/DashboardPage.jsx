import { useEffect, useState } from "react";
import {
  buyCrypto,
  createTransfer,
  getAccountBalance,
  getCryptoPortfolio,
  getCryptos,
} from "../api/auth";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const { token, user } = useAuth();
  const [balanceState, setBalanceState] = useState({
    loading: true,
    error: "",
    account: null,
  });
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
  const [cryptoState, setCryptoState] = useState({
    loading: true,
    error: "",
    cryptos: [],
    portfolio: [],
  });
  const [cryptoForm, setCryptoForm] = useState({
    cryptoId: "",
    amountUsd: "",
  });
  const [cryptoPurchaseState, setCryptoPurchaseState] = useState({
    loading: false,
    error: "",
    success: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [balanceData, cryptoData, portfolioData] = await Promise.all([
          getAccountBalance(token),
          getCryptos(token),
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

        setCryptoState({
          loading: false,
          error: "",
          cryptos: cryptoData.cryptos,
          portfolio: portfolioData.portfolio,
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

        setCryptoState({
          loading: false,
          error: error.message,
          cryptos: [],
          portfolio: [],
        });
      }
    }

    loadDashboardData();

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

  function handleCryptoChange(event) {
    const { name, value } = event.target;
    setCryptoForm((current) => ({
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
      const refreshedBalance = await getAccountBalance(token);

      setBalanceState({
        loading: false,
        error: "",
        account: refreshedBalance.account,
      });

      setTransferData({
        toIdentifier: "",
        amount: "",
        description: "",
      });

      setTransferState({
        loading: false,
        error: "",
        success: data.message || "Transferencia realizada correctamente",
      });
    } catch (error) {
      setTransferState({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  async function handleCryptoSubmit(event) {
    event.preventDefault();
    setCryptoPurchaseState({
      loading: true,
      error: "",
      success: "",
    });

    try {
      const payload = {
        cryptoId: Number(cryptoForm.cryptoId),
        amountUsd: Number(cryptoForm.amountUsd),
      };

      const data = await buyCrypto(token, payload);
      const [refreshedBalance, refreshedPortfolio] = await Promise.all([
        getAccountBalance(token),
        getCryptoPortfolio(token),
      ]);

      setBalanceState({
        loading: false,
        error: "",
        account: refreshedBalance.account,
      });

      setCryptoState((current) => ({
        ...current,
        portfolio: refreshedPortfolio.portfolio,
      }));

      setCryptoForm({
        cryptoId: "",
        amountUsd: "",
      });

      setCryptoPurchaseState({
        loading: false,
        error: "",
        success: data.message || "Compra realizada correctamente",
      });
    } catch (error) {
      setCryptoPurchaseState({
        loading: false,
        error: error.message,
        success: "",
      });
    }
  }

  const balanceValue = balanceState.account
    ? Number(balanceState.account.balance).toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
  const currency = "EUR";

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Panel</p>
        <h1>Dashboard</h1>
        <p className="lead">Tu cuenta bancaria, transferencias y una seccion minima de cripto ya viven aqui.</p>
      </div>

      <div className="dashboard-grid">
        <article className="card stat-card">
          <p className="stat-label">Saldo actual</p>
          <strong className="stat-value">
            {balanceState.loading ? "Cargando..." : `${balanceValue} ${currency}`}
          </strong>
          <span className="stat-note">
            {balanceState.account
              ? `Cuenta ${balanceState.account.account_number}`
              : "Saldo obtenido desde la API"}
          </span>
        </article>

        <article className="card">
          <h2>Usuario autenticado</h2>
          <p>{user ? `${user.nombre} ${user.apellido}` : "Sin datos de usuario"}</p>
          <p>{user?.email || "Email no disponible"}</p>
        </article>

        <article className="card">
          <h2>Estado de cuenta</h2>
          <p>
            {balanceState.account
              ? `${balanceState.account.account_type} creada el ${new Date(
                  balanceState.account.created_at,
                ).toLocaleDateString("es-ES")}`
              : "Sin datos de cuenta todavia"}
          </p>
          {balanceState.error ? <p className="feedback feedback-error">{balanceState.error}</p> : null}
        </article>
      </div>

      <section className="transfer-section">
        <div className="page-header">
          <p className="eyebrow">Transferencias</p>
          <h2 className="section-title">Enviar dinero</h2>
          <p className="lead">
            Puedes transferir a otra cuenta usando su email o DNI, igual que en tu backend.
          </p>
        </div>

        <form className="card form-card form-grid" onSubmit={handleTransferSubmit}>
          <label className="field field-full">
            <span>Destinatario</span>
            <input
              name="toIdentifier"
              onChange={handleTransferChange}
              placeholder="Email o DNI"
              type="text"
              value={transferData.toIdentifier}
            />
          </label>

          <label className="field">
            <span>Importe</span>
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
            <span>Concepto</span>
            <input
              name="description"
              onChange={handleTransferChange}
              placeholder="Transferencia"
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

          <button className="button button-primary field-full" disabled={transferState.loading} type="submit">
            {transferState.loading ? "Enviando..." : "Realizar transferencia"}
          </button>
        </form>
      </section>

      <section className="transfer-section">
        <div className="page-header">
          <p className="eyebrow">Cripto</p>
          <h2 className="section-title">Comprar criptomonedas</h2>
          <p className="lead">
            Implementacion minima: eliges una cripto, defines un importe en EUR y se descuenta de tu saldo.
          </p>
        </div>

        <div className="crypto-grid">
          <div className="card">
            <h3>Mercado</h3>
            {cryptoState.error ? <p className="feedback feedback-error">{cryptoState.error}</p> : null}
            {cryptoState.loading ? (
              <p>Cargando criptomonedas...</p>
            ) : (
              <div className="crypto-list">
                {cryptoState.cryptos.map((crypto) => (
                  <div className="crypto-row" key={crypto.id}>
                    <div>
                      <strong>{crypto.symbol}</strong>
                      <p>{crypto.name}</p>
                    </div>
                    <span>
                      {Number(crypto.current_price).toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      EUR
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form className="card form-card" onSubmit={handleCryptoSubmit}>
            <h3>Compra rapida</h3>

            <label className="field">
              <span>Criptomoneda</span>
              <select name="cryptoId" onChange={handleCryptoChange} value={cryptoForm.cryptoId}>
                <option value="">Selecciona una opcion</option>
                {cryptoState.cryptos.map((crypto) => (
                  <option key={crypto.id} value={crypto.id}>
                    {crypto.symbol} - {crypto.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Importe en EUR</span>
              <input
                min="0"
                name="amountUsd"
                onChange={handleCryptoChange}
                placeholder="100"
                step="0.01"
                type="number"
                value={cryptoForm.amountUsd}
              />
            </label>

            {cryptoPurchaseState.error ? (
              <p className="feedback feedback-error">{cryptoPurchaseState.error}</p>
            ) : null}
            {cryptoPurchaseState.success ? (
              <p className="feedback feedback-success">{cryptoPurchaseState.success}</p>
            ) : null}

            <button className="button button-primary" disabled={cryptoPurchaseState.loading} type="submit">
              {cryptoPurchaseState.loading ? "Comprando..." : "Comprar cripto"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Tu cartera</h3>
          {cryptoState.portfolio.length === 0 ? (
            <p>Aun no has comprado criptomonedas.</p>
          ) : (
            <div className="crypto-list">
              {cryptoState.portfolio.map((item) => (
                <div className="crypto-row" key={item.id}>
                  <div>
                    <strong>{item.symbol}</strong>
                    <p>
                      {item.amount.toFixed(8)} {item.symbol}
                    </p>
                  </div>
                  <span>
                    Compra media:{" "}
                    {Number(item.average_buy_price).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    EUR
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default DashboardPage;
