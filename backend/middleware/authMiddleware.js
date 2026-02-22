const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Temporary Bypass for Studio Testing - Remove in strictly locked production
            if (token === 'MASTER_STUDIO_BYPASS') {
                try {
                    const adminUser = await User.findOne({ email: 'shaikhmdaseel@gmail.com' });
                    req.user = adminUser || { email: 'shaikhmdaseel@gmail.com', isAdmin: true };
                } catch (err) {
                    req.user = { email: 'shaikhmdaseel@gmail.com', isAdmin: true };
                }
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            res.status(401);
            next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.isAdmin || req.user.email === 'shaikhmdaseel@gmail.com')) {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as an admin'));
    }
};

module.exports = { protect, admin };
