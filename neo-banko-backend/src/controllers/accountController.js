const pool = require('../config/db');


const getBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
         a.account_number,
         a.balance,
         a.currency,
         a.account_type,
         a.created_at
       FROM accounts a
       WHERE a.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ninguna cuenta para este usuario'
      });
    }

    const account = result.rows[0];

    res.json({
      success: true,
      account: {
        account_number: account.account_number,
        balance: parseFloat(account.balance),
        currency: account.currency,
        account_type: account.account_type,
        created_at: account.created_at
      }
    });

  } catch (error) {
    console.error('Error al obtener saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el saldo de la cuenta'
    });
  }
};

module.exports = { getBalance };