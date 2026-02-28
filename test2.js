const https = require('https');

const options = {
    hostname: '6sbeyxbq.us-east.insforge.app',
    port: 443,
    path: '/api/database/records/categories?order=name.asc&limit=100',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8',
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body Context:', data.substring(0, 100));
        try {
            const parsed = JSON.parse(data);
            console.log('Categories count:', Array.isArray(parsed) ? parsed.length : 'Not an array');
        } catch (e) {
            console.error('Parse error:', e.message);
        }
    });
});
req.on('error', e => console.error(e));
req.end();
