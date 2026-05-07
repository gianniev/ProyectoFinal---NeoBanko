const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db');

function buildFallbackDni(googleId) {
  const tail = String(googleId || '').slice(-10).padStart(10, '0');
  return `GOO${tail}`;
}

async function ensureUniqueDni(baseDni) {
  let dni = baseDni;
  let suffix = 1;

  while (true) {
    const existing = await pool.query('SELECT id FROM users WHERE dni = $1', [dni]);
    if (existing.rows.length === 0) {
      return dni;
    }

    dni = `${baseDni.slice(0, 15)}${String(suffix).padStart(2, '0')}`;
    suffix += 1;
  }
}

async function ensureAccountForUser(userId) {
  const accountResult = await pool.query('SELECT id FROM accounts WHERE user_id = $1', [userId]);

  if (accountResult.rows.length > 0) {
    return;
  }

  await pool.query(
    `INSERT INTO accounts (user_id, account_number, balance, currency)
     VALUES ($1, $2, 10000.00, 'EUR')`,
    [userId, `ACC-${Date.now().toString().slice(-8)}`]
  );
}

async function findOrCreateGoogleUser(profile) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const nombre = profile.name?.givenName?.trim() || profile.displayName?.trim() || 'Google';
  const apellido = profile.name?.familyName?.trim() || 'User';
  const avatarUrl = profile.photos?.[0]?.value || null;

  if (!email) {
    throw new Error('Google no devolvio un email valido');
  }

  const existing = await pool.query(
    `SELECT id, nombre, apellido, email, avatar_url
     FROM users
     WHERE google_id = $1 OR email = $2
     LIMIT 1`,
    [googleId, email]
  );

  if (existing.rows.length > 0) {
    const user = existing.rows[0];

    await pool.query(
      `UPDATE users
       SET google_id = COALESCE(google_id, $1),
           avatar_url = COALESCE($2, avatar_url),
           nombre = COALESCE(NULLIF($3, ''), nombre),
           apellido = COALESCE(NULLIF($4, ''), apellido),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [googleId, avatarUrl, nombre, apellido, user.id]
    );

    await ensureAccountForUser(user.id);

    return {
      id: user.id,
      nombre: user.nombre || nombre,
      apellido: user.apellido || apellido,
      email: user.email,
      avatar_url: avatarUrl || user.avatar_url || null,
    };
  }

  const dni = await ensureUniqueDni(buildFallbackDni(googleId));
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const inserted = await pool.query(
    `INSERT INTO users (dni, nombre, apellido, email, password_hash, google_id, avatar_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, nombre, apellido, email, avatar_url`,
    [dni, nombre, apellido, email, passwordHash, googleId, avatarUrl]
  );

  const user = inserted.rows[0];
  await ensureAccountForUser(user.id);

  return user;
}

function configurePassport() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.warn('Google OAuth no esta completamente configurado. Revisa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REDIRECT_URI.');
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateGoogleUser(profile);
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query(
        'SELECT id, nombre, apellido, email, avatar_url FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        done(null, false);
        return;
      }

      done(null, result.rows[0]);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}

module.exports = configurePassport;
