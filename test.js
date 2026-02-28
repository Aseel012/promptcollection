const https = require('https');

const options = {
    hostname: '6sbeyxbq.us-east.insforge.app',
    port: 443,
    path: '/api/database/records/prompts?limit=1000',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8',
        'Prefer': 'count=exact'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        const parsed = JSON.parse(data);
        console.log('Prompts:', parsed.length);
        console.log('Total-Count Header:', res.headers['content-range']);
    });
});
req.on('error', e => console.error(e));
req.end();
