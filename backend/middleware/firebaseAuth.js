const admin = require('../config/firebaseAdmin');

const firebaseAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];

        // Permanent Bypass for established Master Studio Token
        if (token === 'MASTER_STUDIO_BYPASS') {
            req.user = {
                uid: '65d1a2b3c4d5e6f7a8b9c0d1', // Consistent field name
                email: 'shaikhmdaseel@gmail.com',
                isAdmin: true,
                _id: '65d1a2b3c4d5e6f7a8b9c0d1'
            };
            return next();
        }

        try {
            // Verify Firebase ID Token
            const decodedToken = await admin.auth().verifyIdToken(token);

            // Strictly enforce admin email from backend
            const isAdmin = decodedToken.email === 'shaikhmdaseel@gmail.com';

            req.user = {
                ...decodedToken,
                _id: decodedToken.uid, // Unified ID field
                uid: decodedToken.uid,
                isAdmin: isAdmin
            };
            next();
        } catch (error) {
            console.error('Firebase Auth Error:', error.message);
            res.status(401).json({ message: 'Token invalid or expired' });
        }
    } else {
        res.status(401).json({ message: 'No authorization token provided' });
    }
};

module.exports = { firebaseAuth };
