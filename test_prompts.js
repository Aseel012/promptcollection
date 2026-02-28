const fs = require('fs');

async function test() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8";
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
        console.log("Fetching prompts...");
        const res = await fetch("https://6sbeyxbq.us-east.insforge.app/api/database/records/prompts?limit=100", { headers });
        const dataText = await res.text();

        let text = "Prompts status: " + res.status + "\\n";
        text += "Prompts response start:\\n" + dataText.substring(0, 500) + "\\n...\\n";
        text += "Prompts response length: " + dataText.length + " characters\\n";

        try {
            const json = JSON.parse(dataText);
            text += "Parsed length: " + (Array.isArray(json) ? json.length : "Not an array");
        } catch (e) {
            text += "Parse error: " + e.message;
        }

        fs.writeFileSync('out_prompts.txt', text);
        console.log("Done.");
    } catch (e) {
        fs.writeFileSync('out_prompts.txt', "Error: " + e.message);
        console.log("Failed.");
    }
}
test();
