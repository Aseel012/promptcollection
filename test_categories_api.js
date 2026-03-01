
const INSFORGE_BASE_URL = 'https://6sbeyxbq.us-east.insforge.app';
const INSFORGE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQ2NjB9.Xl_N3iZduysKPZO461GsBQfcuEYhU6urOjTAD7QgMS8';

const defaultHeaders = {
    'Authorization': `Bearer ${INSFORGE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
};

async function testFetch() {
    try {
        const selectParam = 'id,name,image,description,created_at,updated_at';
        const url = `${INSFORGE_BASE_URL}/api/database/records/categories?select=${selectParam}&order=name.asc&limit=100`;
        console.log('Fetching:', url);
        const res = await fetch(url, { headers: defaultHeaders });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data count:', Array.isArray(data) ? data.length : 'Not an array');
        if (!Array.isArray(data)) {
            console.log('Data:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testFetch();
