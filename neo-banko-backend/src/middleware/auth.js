const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');

const authMiddleware = (req, res, next) => {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No se proporcionó token de autenticación'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const jwtSecret = getJwtSecret();
        // Verificar el token
        const decoded = jwt.verify(token, jwtSecret);

        // Adjuntar el usuario decodificado a req
        req.user = decoded;

        next(); // Continuar a la ruta protegida
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

module.exports = authMiddleware;
