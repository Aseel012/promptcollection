const fs = require('fs');
async function test() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8";
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    try {
        const res = await fetch("https://6sbeyxbq.us-east.insforge.app/api/database/records/categories?order=name.asc&limit=100", { headers });
        const dataText = await res.text();
        let text = "Categories response:\\n";
        try {
            const data = JSON.parse(dataText);
            if (Array.isArray(data)) {
                text += "Length: " + data.length + "\\n";
                text += "Names:\\n" + data.map(d => d.name).join("\\n");
            } else {
                text += "Not an array: " + dataText;
            }
        } catch (e) {
            text += "Parse error: " + e.message;
        }
        fs.writeFileSync('out_cats.txt', text);
    } catch (e) {
        fs.writeFileSync('out_cats.txt', "Error: " + e.message);
    }
}
test();
