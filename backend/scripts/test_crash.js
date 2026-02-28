try {
    const admin = require('../config/firebaseAdmin');
    const { getStorage } = require('firebase-admin/storage');
    console.log("Firebase storage loaded.");
} catch (e) {
    require('fs').writeFileSync('crash.txt', e.stack);
}
