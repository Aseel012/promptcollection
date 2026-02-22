const dotenv = require('dotenv');
dotenv.config();
const key = process.env.FIREBASE_PRIVATE_KEY;
console.log('KEY TYPE:', typeof key);
console.log('KEY LENGTH:', key ? key.length : 0);
console.log('KEY STARTS WITH:', key ? key.substring(0, 30) : 'N/A');
console.log('KEY ENDS WITH:', key ? key.substring(key.length - 30) : 'N/A');

if (key) {
    const formatted = key.replace(/\\n/g, '\n').replace(/"/g, '');
    console.log('FORMATTED STARTS WITH:', formatted.substring(0, 30));
    console.log('FORMATTED HAS NEWLINES:', formatted.includes('\n'));
}
