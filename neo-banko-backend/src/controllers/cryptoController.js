const pool = require('../config/db');

const CMC_LISTINGS_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

function mapMarketEntry(item) {
  return {
    cmc_id: item.id,
    symbol: item.symbol,
    name: item.name,
    current_price: Number(item?.quote?.EUR?.price || 0),
    percent_change_1h: Number(item?.quote?.EUR?.percent_change_1h || 0),
    percent_change_24h: Number(item?.quote?.EUR?.percent_change_24h || 0),
    percent_change_7d: Number(item?.quote?.EUR?.percent_change_7d || 0),
    market_cap: Number(item?.quote?.EUR?.market_cap || 0),
    volume_24h: Number(item?.quote?.EUR?.volume_24h || 0),
    circulating_supply: Number(item?.circulating_supply || 0),
    last_updated: item?.quote?.EUR?.last_updated || item.last_updated || null,
  };
}

async function syncMarketCryptos(cryptos) {
  const syncedRows = await Promise.all(
    cryptos.map((crypto) =>
      pool.query(
        `INSERT INTO cryptocurrencies (cmc_id, symbol, name, current_price, last_updated)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (symbol) DO UPDATE
         SET cmc_id = EXCLUDED.cmc_id,
             name = EXCLUDED.name,
             current_price = EXCLUDED.current_price,
             last_updated = CURRENT_TIMESTAMP
         RETURNING id, symbol`,
        [crypto.cmc_id, crypto.symbol, crypto.name, crypto.current_price]
      )
    )
  );

  const idsBySymbol = new Map(
    syncedRows.map((result) => [result.rows[0].symbol, result.rows[0].id])
  );

  return cryptos.map((crypto) => ({
    ...crypto,
    id: idsBySymbol.get(crypto.symbol),
  }));
}

const listMarketCryptos = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const start = ((page - 1) * limit) + 1;
  const apiKey = process.env.API_COIN_MARKETCAP;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: 'No se configuro API_COIN_MARKETCAP en el entorno',
    });
  }

  try {
    const query = new URLSearchParams({
      start: String(start),
      limit: String(limit),
      convert: 'EUR',
    });

    const response = await fetch(`${CMC_LISTINGS_URL}?${query.toString()}`, {
      headers: {
        Accept: 'application/json',
        'X-CMC_PRO_API_KEY': apiKey,
      },
    });

    const payload = await response.json();

    if (!response.ok) {
      const apiMessage = payload?.status?.error_message || 'Error de CoinMarketCap';
      return res.status(response.status).json({
        success: false,
        message: `CoinMarketCap: ${apiMessage}`,
      });
    }

    const entries = Array.isArray(payload.data) ? payload.data : [];
    const total = Number(payload?.status?.total_count) || null;
    const cryptos = await syncMarketCryptos(entries.map(mapMarketEntry));

    res.json({
      success: true,
      page,
      limit,
      total,
      hasNextPage: total ? (page * limit) < total : entries.length === limit,
      cryptos,
    });
  } catch (error) {
    console.error('Error al obtener mercado de CoinMarketCap:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener criptomonedas en tiempo real',
    });
  }
};

const listCryptos = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, cmc_id, symbol, name, current_price, last_updated
       FROM cryptocurrencies
       ORDER BY current_price DESC`
    );

    res.json({
      success: true,
      cryptos: result.rows.map((crypto) => ({
        ...crypto,
        current_price: parseFloat(crypto.current_price),
      })),
    });
  } catch (error) {
    console.error('Error al listar criptomonedas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las criptomonedas',
    });
  }
};

const getPortfolio = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         cp.id,
         cp.crypto_id,
         c.cmc_id,
         c.symbol,
         c.name,
         cp.amount,
         cp.average_buy_price,
         c.current_price
       FROM crypto_portfolio cp
       JOIN cryptocurrencies c ON c.id = cp.crypto_id
       WHERE cp.user_id = $1
       ORDER BY c.symbol`,
      [req.user.id]
    );

    res.json({
      success: true,
      portfolio: result.rows.map((item) => ({
        ...item,
        amount: parseFloat(item.amount),
        average_buy_price: parseFloat(item.average_buy_price),
        current_price: parseFloat(item.current_price),
      })),
    });
  } catch (error) {
    console.error('Error al obtener portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el portfolio de criptomonedas',
    });
  }
};

const buyCrypto = async (req, res) => {
  const { cryptoId, amountUsd, amountEur } = req.body || {};
  const numericCryptoId = Number(cryptoId);
  const numericAmountEur = Number(amountEur ?? amountUsd);

  if (!numericCryptoId || !numericAmountEur || numericAmountEur <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere cryptoId e importe positivo',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const accountResult = await client.query(
      'SELECT id, balance FROM accounts WHERE user_id = $1',
      [req.user.id]
    );

    if (accountResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'No se encontro una cuenta bancaria para este usuario',
      });
    }

    const account = accountResult.rows[0];
    const balance = parseFloat(account.balance);

    if (balance < numericAmountEur) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para comprar criptomonedas',
      });
    }

    const cryptoResult = await client.query(
      `SELECT id, symbol, name, current_price
       FROM cryptocurrencies
       WHERE id = $1`,
      [numericCryptoId]
    );

    if (cryptoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Criptomoneda no encontrada',
      });
    }

    const crypto = cryptoResult.rows[0];
    const currentPrice = parseFloat(crypto.current_price);
    const cryptoAmount = numericAmountEur / currentPrice;

    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [numericAmountEur, account.id]
    );

    const existingPosition = await client.query(
      `SELECT id, amount, average_buy_price
       FROM crypto_portfolio
       WHERE user_id = $1 AND crypto_id = $2`,
      [req.user.id, numericCryptoId]
    );

    if (existingPosition.rows.length === 0) {
      await client.query(
        `INSERT INTO crypto_portfolio (user_id, crypto_id, amount, average_buy_price)
         VALUES ($1, $2, $3, $4)`,
        [req.user.id, numericCryptoId, cryptoAmount, currentPrice]
      );
    } else {
      const position = existingPosition.rows[0];
      const currentAmount = parseFloat(position.amount);
      const currentAverage = parseFloat(position.average_buy_price);
      const updatedAmount = currentAmount + cryptoAmount;
      const updatedAverage =
        ((currentAmount * currentAverage) + (cryptoAmount * currentPrice)) / updatedAmount;

      await client.query(
        `UPDATE crypto_portfolio
         SET amount = $1,
             average_buy_price = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [updatedAmount, updatedAverage, position.id]
      );
    }

    await client.query(
      `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, status)
       VALUES ($1, NULL, $2, 'crypto_buy', $3, 'completed')`,
      [account.id, numericAmountEur, `Compra de ${crypto.symbol}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Compra de ${crypto.symbol} realizada con exito`,
      purchase: {
        cryptoId: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        spentEur: numericAmountEur,
        amountBought: cryptoAmount,
        unitPrice: currentPrice,
      },
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error en rollback de compra cripto:', rollbackError);
    }

    console.error('Error al comprar criptomoneda:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la compra de criptomonedas',
    });
  } finally {
    client.release();
  }
};

module.exports = { listCryptos, listMarketCryptos, getPortfolio, buyCrypto };
