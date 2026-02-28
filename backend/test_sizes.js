const { Client } = require('pg');
const fs = require('fs');

async function checkSizes() {
    const client = new Client({
        connectionString: 'postgresql://postgres:dc364af68ff3b138ba069d9119a25b55@6sbeyxbq.us-east.database.insforge.app:5432/insforge?sslmode=require'
    });

    try {
        await client.connect();

        const promptsRes = await client.query('SELECT id, title, LENGTH(image) as img_len FROM prompts ORDER BY LENGTH(image) DESC NULLS LAST LIMIT 10');
        let out = "Top 10 Prompts by Image Length:\\n";
        promptsRes.rows.forEach(r => out += `${r.id} | ${r.title} | ${r.img_len}\\n`);

        const catRes = await client.query('SELECT id, name, LENGTH(image) as img_len FROM categories ORDER BY LENGTH(image) DESC NULLS LAST LIMIT 10');
        out += "\\nTop 10 Categories by Image Length:\\n";
        catRes.rows.forEach(r => out += `${r.id} | ${r.name} | ${r.img_len}\\n`);

        const totalPrompts = await client.query('SELECT COUNT(*) FROM prompts');
        out += `\\nTotal Prompts: ${totalPrompts.rows[0].count}\\n`;

        fs.writeFileSync('db_sizes.txt', out);
        console.log("Analysis saved to db_sizes.txt");
    } catch (e) {
        fs.writeFileSync('db_sizes.txt', "Error: " + e.stack);
        console.error("Error", e);
    } finally {
        await client.end();
    }
}

checkSizes();
