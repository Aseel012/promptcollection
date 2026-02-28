const fs = require('fs');
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8";

async function testSafe() {
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    let log = "";
    try {
        const resCats = await fetch("https://6sbeyxbq.us-east.insforge.app/api/database/records/categories?select=id,name", { headers });
        const cats = await resCats.json();
        log += "Categories returned: " + (Array.isArray(cats) ? cats.length : cats.message) + "\\n";

        const resPrompts = await fetch("https://6sbeyxbq.us-east.insforge.app/api/database/records/prompts?select=id,title&limit=1000", { headers });
        const prompts = await resPrompts.json();
        log += "Prompts returned: " + (Array.isArray(prompts) ? prompts.length : prompts.message) + "\\n";
    } catch (e) {
        log += "Error: " + e.message + "\\n";
    }
    fs.writeFileSync('test_safe_out.txt', log);
}

testSafe();
