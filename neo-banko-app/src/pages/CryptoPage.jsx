import { useEffect, useRef, useState } from "react";
import {
  buyCrypto,
  getAccountBalance,
  getCryptoPortfolio,
  getMarketCryptos,
} from "../api/auth";
import ProcessingItem from "../components/ProcessingItem";
import Skeleton from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

function SkeletonTable() {
  const columns = [
    "Crypto",
    "Price (EUR)",
    "1h %",
    "24h %",
    "7d %",
    "Market Cap",
    "Volume(24h)",
    "Circulating Supply",
  ];

  return (
    <div className="crypto-list-scroll" aria-label="Cargando mercado">
      <table className="crypto-market-table crypto-market-skeleton-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td>
                <div className="crypto-skeleton-name">
                  <Skeleton className="skeleton-text skeleton-w-64" />
                  <Skeleton className="skeleton-text skeleton-w-88" />
                </div>
              </td>
              <td><Skeleton className="skeleton-text skeleton-w-96" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-56" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-56" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-56" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-88" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-88" /></td>
              <td><Skeleton className="skeleton-text skeleton-w-96" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="crypto-pagination crypto-pagination-skeleton">
        <Skeleton className="skeleton-button skeleton-pagination-button" />
        <Skeleton className="skeleton-text skeleton-w-64" />
        <Skeleton className="skeleton-button skeleton-pagination-button" />
      </div>
    </div>
  );
}

function CryptoFormSkeleton() {
  return (
    <div className="crypto-form-skeleton" aria-label="Cargando compra rapida">
      <div className="field">
        <Skeleton className="skeleton-label" />
        <Skeleton className="skeleton-input" />
      </div>
      <div className="field">
        <Skeleton className="skeleton-label" />
        <Skeleton className="skeleton-input" />
      </div>
      <Skeleton className="skeleton-button" />
    </div>
  );
}

function PortfolioSkeleton() {
  return (
    <div className="crypto-portfolio-table" aria-label="Cargando cartera">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="crypto-portfolio-table-row" key={index}>
          <div className="crypto-portfolio-asset">
            <Skeleton className="crypto-portfolio-icon" />
            <div className="crypto-portfolio-skeleton-name">
              <Skeleton className="skeleton-text skeleton-w-40" />
              <Skeleton className="skeleton-text skeleton-w-72" />
            </div>
          </div>
          <div className="crypto-portfolio-table-metric">
            <Skeleton className="skeleton-text skeleton-w-40" />
            <Skeleton className="skeleton-text skeleton-w-96" />
          </div>
          <div className="crypto-portfolio-table-metric">
            <Skeleton className="skeleton-text skeleton-w-72" />
            <Skeleton className="skeleton-text skeleton-w-96" />
          </div>
          <div className="crypto-portfolio-table-metric">
            <Skeleton className="skeleton-text skeleton-w-56" />
            <Skeleton className="skeleton-text skeleton-w-120" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getCryptoIconUrl(cmcId) {
  return cmcId ? `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png` : "";
}

function CryptoPage() {
  const { token } = useAuth();
  const cryptoSelectRef = useRef(null);
  const [cryptoState, setCryptoState] = useState({
    loadingMarket: true,
    loadingBuyOptions: true,
    loadingPortfolio: true,
    error: "",
    marketCryptos: [],
    buyCryptos: [],
    portfolio: [],
    marketPage: 1,
    marketLimit: 10,
    hasNextPage: false,
  });
  const [cryptoForm, setCryptoForm] = useState({
    cryptoId: "",
    amountEur: "",
  });
  const [cryptoPurchaseState, setCryptoPurchaseState] = useState({
    loading: false,
    error: "",
    success: "",
  });
  const [isCryptoSelectOpen, setIsCryptoSelectOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCryptoData() {
      try {
        const [marketData, portfolioData] = await Promise.all([
          getMarketCryptos(token, 1, 100),
          getCryptoPortfolio(token),
        ]);
        const marketCryptos = marketData.cryptos || [];

        if (!isMounted) {
          return;
        }

        setCryptoState({
          loadingMarket: false,
          loadingBuyOptions: false,
          loadingPortfolio: false,
          error: "",
          marketCryptos: marketCryptos.slice(0, 10),
          buyCryptos: marketCryptos,
          portfolio: portfolioData.portfolio,
          marketPage: 1,
          marketLimit: 10,
          hasNextPage: Boolean(marketData.hasNextPage),
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCryptoState({
          loadingMarket: false,
          loadingBuyOptions: false,
          loadingPortfolio: false,
          error: error.message,
          marketCryptos: [],
          buyCryptos: [],
          portfolio: [],
          marketPage: 1,
          marketLimit: 10,
          hasNextPage: false,
        });
      }
    }

    loadCryptoData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (cryptoSelectRef.current && !cryptoSelectRef.current.contains(event.target)) {
        setIsCryptoSelectOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function changeMarketPage(nextPage) {
    if (nextPage < 1 || cryptoState.loadingMarket) {
      return;
    }

    setCryptoState((current) => ({
      ...current,
      loadingMarket: true,
      error: "",
    }));

    try {
      const data = await getMarketCryptos(token, nextPage, cryptoState.marketLimit);
      setCryptoState((current) => ({
        ...current,
        loadingMarket: false,
        marketCryptos: data.cryptos || [],
        marketPage: data.page || nextPage,
        marketLimit: data.limit || current.marketLimit,
        hasNextPage: Boolean(data.hasNextPage),
      }));
    } catch (error) {
      setCryptoState((current) => ({
        ...current,
        loadingMarket: false,
        error: error.message,
      }));
    }
  }

  function handleCryptoChange(event) {
    const { name, value } = event.target;
    setCryptoForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCryptoSelect(cryptoId) {
    setCryptoForm((current) => ({
      ...current,
      cryptoId: String(cryptoId),
    }));
    setIsCryptoSelectOpen(false);
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
        amountEur: Number(cryptoForm.amountEur),
      };

      const data = await buyCrypto(token, payload);
      const [, refreshedPortfolio] = await Promise.all([
        getAccountBalance(token),
        getCryptoPortfolio(token),
      ]);

      setCryptoState((current) => ({
        ...current,
        portfolio: refreshedPortfolio.portfolio,
      }));

      setCryptoForm({
        cryptoId: "",
        amountEur: "",
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

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function formatPercent(value) {
    const numeric = Number(value || 0);
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`;
  }

  function formatCompact(value) {
    return Number(value || 0).toLocaleString("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    });
  }

  function formatCryptoAmount(value) {
    return Number(value || 0).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }

  const selectedCrypto = cryptoState.buyCryptos.find(
    (crypto) => String(crypto.id) === String(cryptoForm.cryptoId)
  );

  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Crypto</p>
        <p className="lead">
          Compra criptomonedas y consulta tu cartera sin salir de Neo Banko.
        </p>
      </div>

      <div className="crypto-grid">
        <div className="card crypto-panel">
          <h3>Mercado</h3>
          {cryptoState.error ? <p className="feedback feedback-error">{cryptoState.error}</p> : null}
          {cryptoState.loadingMarket ? (
            <SkeletonTable />
          ) : (
            <>
              <div className="crypto-list-scroll">
                <table className="crypto-market-table">
                  <thead>
                    <tr>
                      <th>Crypto</th>
                      <th>Price (EUR)</th>
                      <th>1h %</th>
                      <th>24h %</th>
                      <th>7d %</th>
                      <th>Market Cap</th>
                      <th>Volume(24h)</th>
                      <th>Circulating Supply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cryptoState.marketCryptos.map((crypto) => (
                      <tr key={crypto.cmc_id}>
                        <td>
                          <strong>{crypto.symbol}</strong>
                          <p>{crypto.name}</p>
                        </td>
                        <td>{formatMoney(crypto.current_price)} EUR</td>
                        <td className={Number(crypto.percent_change_1h) >= 0 ? "pct-up" : "pct-down"}>
                          {formatPercent(crypto.percent_change_1h)}
                        </td>
                        <td className={Number(crypto.percent_change_24h) >= 0 ? "pct-up" : "pct-down"}>
                          {formatPercent(crypto.percent_change_24h)}
                        </td>
                        <td className={Number(crypto.percent_change_7d) >= 0 ? "pct-up" : "pct-down"}>
                          {formatPercent(crypto.percent_change_7d)}
                        </td>
                        <td>{formatCompact(crypto.market_cap)} EUR</td>
                        <td>{formatCompact(crypto.volume_24h)} EUR</td>
                        <td>{formatCompact(crypto.circulating_supply)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="crypto-pagination">
                <button
                  className="button button-secondary button-small"
                  disabled={cryptoState.marketPage <= 1 || cryptoState.loadingMarket}
                  onClick={() => changeMarketPage(cryptoState.marketPage - 1)}
                  type="button"
                >
                  Anterior
                </button>
                <span>Pagina {cryptoState.marketPage}</span>
                <button
                  className="button button-secondary button-small"
                  disabled={!cryptoState.hasNextPage || cryptoState.loadingMarket}
                  onClick={() => changeMarketPage(cryptoState.marketPage + 1)}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>

        <div className="crypto-portfolio-panel">
          <h3>TU CARTERA</h3>
          {cryptoState.loadingPortfolio ? (
            <PortfolioSkeleton />
          ) : cryptoState.portfolio.length === 0 ? (
            <p className="crypto-portfolio-empty">Aun no has comprado criptomonedas.</p>
          ) : (
            <div className="crypto-portfolio-table">
              {cryptoState.portfolio.map((item) => (
                <div className="crypto-portfolio-table-row" key={item.crypto_id || item.id}>
                  <div className="crypto-portfolio-asset">
                    {item.cmc_id ? (
                      <img
                        alt=""
                        aria-hidden="true"
                        className="crypto-portfolio-icon"
                        src={getCryptoIconUrl(item.cmc_id)}
                      />
                    ) : (
                      <span className="crypto-portfolio-icon-fallback">{item.symbol.slice(0, 1)}</span>
                    )}
                    <div>
                      <strong>{item.symbol}</strong>
                      <p>{item.name}</p>
                    </div>
                  </div>
                  <div className="crypto-portfolio-table-metric">
                    <span>Valor</span>
                    <strong>{formatMoney(Number(item.amount) * Number(item.current_price))} EUR</strong>
                  </div>
                  <div className="crypto-portfolio-table-metric">
                    <span>Compra media</span>
                    <strong>{formatMoney(item.average_buy_price)} EUR</strong>
                  </div>
                  <div className="crypto-portfolio-table-metric">
                    <span>Cantidad</span>
                    <strong>{formatCryptoAmount(item.amount)} {item.symbol}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form className="card form-card crypto-panel crypto-form" onSubmit={handleCryptoSubmit}>
          <h3>Compra rapida</h3>

          {cryptoState.loadingBuyOptions ? (
            <CryptoFormSkeleton />
          ) : (
            <>
              <label className="field">
                <span>Criptomoneda</span>
                <div className="crypto-select" ref={cryptoSelectRef}>
                  <button
                    aria-expanded={isCryptoSelectOpen}
                    aria-haspopup="listbox"
                    className="crypto-select-trigger"
                    onClick={() => setIsCryptoSelectOpen((current) => !current)}
                    type="button"
                  >
                    {selectedCrypto ? (
                      <span className="crypto-select-value">
                        {selectedCrypto.cmc_id ? (
                          <img
                            alt=""
                            aria-hidden="true"
                            className="crypto-select-icon"
                            src={getCryptoIconUrl(selectedCrypto.cmc_id)}
                          />
                        ) : (
                          <span className="crypto-select-icon-fallback">{selectedCrypto.symbol.slice(0, 1)}</span>
                        )}
                        <span>{selectedCrypto.symbol} - {selectedCrypto.name}</span>
                      </span>
                    ) : (
                      <span className="crypto-select-placeholder">Selecciona una opcion</span>
                    )}
                    <span aria-hidden="true" className="crypto-select-caret">▾</span>
                  </button>

                  {isCryptoSelectOpen ? (
                    <ul className="crypto-select-menu" role="listbox">
                      <li>
                        <button
                          className="crypto-select-option"
                          onClick={() => handleCryptoSelect("")}
                          type="button"
                        >
                          <span className="crypto-select-placeholder">Selecciona una opcion</span>
                        </button>
                      </li>
                      {cryptoState.buyCryptos.map((crypto) => (
                        <li key={crypto.id}>
                          <button
                            className="crypto-select-option"
                            onClick={() => handleCryptoSelect(crypto.id)}
                            type="button"
                          >
                            {crypto.cmc_id ? (
                              <img
                                alt=""
                                aria-hidden="true"
                                className="crypto-select-icon"
                                src={getCryptoIconUrl(crypto.cmc_id)}
                              />
                            ) : (
                              <span className="crypto-select-icon-fallback">{crypto.symbol.slice(0, 1)}</span>
                            )}
                            <span>{crypto.symbol} - {crypto.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </label>

              {selectedCrypto ? (
                <p className="crypto-selected-price">
                  Precio actual: {formatMoney(selectedCrypto.current_price)} EUR
                </p>
              ) : null}

              <label className="field">
                <span>Importe en EUR</span>
                <input
                  min="0"
                  name="amountEur"
                  onChange={handleCryptoChange}
                  placeholder="100"
                  step="0.01"
                  type="number"
                  value={cryptoForm.amountEur}
                />
              </label>

              {cryptoPurchaseState.error ? (
                <p className="feedback feedback-error">{cryptoPurchaseState.error}</p>
              ) : null}
              {cryptoPurchaseState.success ? (
                <p className="feedback feedback-success">{cryptoPurchaseState.success}</p>
              ) : null}

              {cryptoPurchaseState.loading ? (
                <ProcessingItem
                  amount={cryptoForm.amountEur ? `${formatMoney(cryptoForm.amountEur)} EUR` : ""}
                  title="Procesando compra"
                />
              ) : null}

              <button className="button button-primary" disabled={cryptoPurchaseState.loading} type="submit">
                Comprar cripto
              </button>
            </>
          )}
        </form>
      </div>

    </section>
  );
}

export default CryptoPage;
