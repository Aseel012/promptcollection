
import axios from 'axios';

const url = 'https://6sbeyxbq.us-east.insforge.app';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8';

async function test() {
    try {
        console.log('Testing categories...');
        const catRes = await axios.get(`${url}/rest/v1/categories`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        console.log('Categories:', catRes.data.length);

        console.log('Testing prompts...');
        const promRes = await axios.get(`${url}/rest/v1/prompts?select=*&limit=5`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        console.log('Prompts:', promRes.data.length);
        if (promRes.data.length > 0) {
            console.log('First prompt image:', promRes.data[0].image);
        }
    } catch (e) {
        console.error('API Error:', e.message);
    }
}

test();
