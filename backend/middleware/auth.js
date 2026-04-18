const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

exports.adminAuth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;

        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
