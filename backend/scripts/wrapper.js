try {
    require('./migrate_base64_to_firebase.js');
} catch (e) {
    require('fs').writeFileSync('crash_migrate.txt', e.stack);
}
