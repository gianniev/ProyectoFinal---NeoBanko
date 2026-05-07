const pool = require('../config/db');

const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const historyResult = await pool.query(
      `SELECT
         t.id,
         t.amount,
         t.transaction_type,
         t.description,
         t.status,
         t.created_at,
         af.account_number AS from_account_number,
         at.account_number AS to_account_number,
         uf.nombre AS from_nombre,
         uf.apellido AS from_apellido,
         ut.nombre AS to_nombre,
         ut.apellido AS to_apellido,
         CASE
           WHEN af.user_id = $1 THEN 'sent'
           WHEN at.user_id = $1 THEN 'received'
           ELSE 'other'
         END AS direction
       FROM transactions t
       JOIN accounts af ON af.id = t.from_account_id
       JOIN accounts at ON at.id = t.to_account_id
       JOIN users uf ON uf.id = af.user_id
       JOIN users ut ON ut.id = at.user_id
       WHERE af.user_id = $1 OR at.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [userId]
    );

    const transactions = historyResult.rows.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      transaction_type: row.transaction_type,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      from_account_number: row.from_account_number,
      to_account_number: row.to_account_number,
      from_name: `${row.from_nombre} ${row.from_apellido}`,
      to_name: `${row.to_nombre} ${row.to_apellido}`,
      direction: row.direction
    }));

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error al obtener historial de transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de transacciones'
    });
  }
};

const transfer = async (req, res) => {
  const { toIdentifier, amount, description = 'Transferencia' } = req.body || {};
  const fromUserId = req.user.id;
  const normalizedIdentifier = String(toIdentifier || '').trim();
  const numericAmount = Number(amount);

  if (!normalizedIdentifier || !numericAmount || numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere toIdentifier y amount positivo'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const senderAccount = await client.query(
      'SELECT id, balance FROM accounts WHERE user_id = $1',
      [fromUserId]
    );

    if (senderAccount.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'No tienes cuenta'
      });
    }

    const senderBalance = parseFloat(senderAccount.rows[0].balance);
    const senderAccountId = senderAccount.rows[0].id;

    if (senderBalance < numericAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    const recipientQuery = await client.query(
      `SELECT u.id, a.id AS account_id
       FROM users u
       JOIN accounts a ON u.id = a.user_id
       WHERE LOWER(u.email) = LOWER($1) OR UPPER(u.dni) = UPPER($1)`,
      [normalizedIdentifier]
    );

    if (recipientQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Destinatario no encontrado'
      });
    }

    const recipientAccountId = recipientQuery.rows[0].account_id;

    if (recipientAccountId === senderAccountId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No puedes transferirte dinero a ti mismo'
      });
    }

    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
      [numericAmount, senderAccountId]
    );

    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [numericAmount, recipientAccountId]
    );

    await client.query(
      `INSERT INTO transactions (from_account_id, to_account_id, amount, transaction_type, description, status)
       VALUES ($1, $2, $3, 'transfer', $4, 'completed')`,
      [senderAccountId, recipientAccountId, numericAmount, description]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Transferencia realizada con exito',
      amount: numericAmount,
      to: normalizedIdentifier,
      newBalance: senderBalance - numericAmount
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error en rollback de transferencia:', rollbackError);
    }

    console.error('Error en transferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la transferencia'
    });
  } finally {
    client.release();
  }
};

module.exports = { transfer, getTransactionHistory };
