const fs = require('fs');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8";
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

let outLog = '';
function log(msg) {
    outLog += msg + "\\n";
}

async function testLimit(limit) {
    try {
        const res = await fetch(`https://6sbeyxbq.us-east.insforge.app/api/database/records/prompts?limit=${limit}`, { headers });
        const text = await res.text();
        let len = "FAIL";
        try { len = JSON.parse(text).length; } catch (e) { }
        log(`Limit ${limit} -> Status: ${res.status}, Parsed length: ${len}`);
        if (res.status !== 200) log(text.substring(0, 100));
    } catch (e) {
        log(`Limit ${limit} -> Error: ${e.message}`);
    }
}

async function run() {
    await testLimit(5);
    await testLimit(12);
    await testLimit(24);
    await testLimit(100);
    await testLimit(1000);
    fs.writeFileSync('test_limit_out.txt', outLog);
}

run();
