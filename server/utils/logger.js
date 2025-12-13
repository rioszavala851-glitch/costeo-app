/**
 * Logger Estructurado con Winston
 * Proporciona logs en formato JSON para fácil análisis
 */
const winston = require('winston');
const path = require('path');

// Directorio de logs
const logsDir = path.join(__dirname, '../logs');

// Formato personalizado para desarrollo
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

// Formato JSON para producción
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: {
        service: 'costeo-api',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Archivo para errores
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: prodFormat
        }),
        // Archivo para todos los logs
        new winston.transports.File({
            filename: path.join(logsDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: prodFormat
        }),
    ],
});

// En desarrollo, también loguear a consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: devFormat
    }));
}

// Métodos helper para logging contextual
logger.http = (message, meta = {}) => {
    logger.info(message, { type: 'http', ...meta });
};

logger.auth = (message, meta = {}) => {
    logger.info(message, { type: 'auth', ...meta });
};

logger.db = (message, meta = {}) => {
    logger.info(message, { type: 'database', ...meta });
};

logger.security = (message, meta = {}) => {
    logger.warn(message, { type: 'security', ...meta });
};

logger.limit = (message, meta = {}) => {
    logger.info(message, { type: 'limit', ...meta });
};

// Middleware de Express para logging de requests
logger.requestMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous'
        };

        if (res.statusCode >= 400) {
            logger.warn('Request failed', logData);
        } else {
            logger.http('Request completed', logData);
        }
    });

    next();
};

// Función para crear stream compatible con Morgan
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

module.exports = logger;
