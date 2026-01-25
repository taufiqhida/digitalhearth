const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Verify JWT Token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token tidak ditemukan' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User tidak valid atau tidak aktif' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Anda tidak memiliki akses ke resource ini' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
