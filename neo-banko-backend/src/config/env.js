function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return String(value).trim();
}

function isWeakSecret(secret) {
  const normalized = String(secret).toLowerCase();
  return (
    secret.length < 32 ||
    normalized.includes('tu_super_secreto') ||
    normalized.includes('changeme') ||
    normalized.includes('secret')
  );
}

function getJwtSecret() {
  const secret = getRequiredEnv('JWT_SECRET');
  if (isWeakSecret(secret)) {
    throw new Error('JWT_SECRET es debil. Usa un valor aleatorio de al menos 32 caracteres.');
  }
  return secret;
}

module.exports = {
  getRequiredEnv,
  getJwtSecret,
};
