
require('dotenv').config({ path: '../backend/.env' }); // Adjust path if running from root or backend
// Try to handle path better
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


console.log('Node Version:', process.version);
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL defined:', !!url);
console.log('Supabase Key defined:', !!key);

if (url) {
    console.log('Supabase URL starts with:', url.substring(0, 10) + '...');
}

async function testFetch() {
    try {
        console.log('Testing fetch to google.com...');
        const res = await fetch('https://google.com');
        console.log('Fetch google status:', res.status);
    } catch (e) {
        console.error('Fetch google failed:', e.message);
    }

    try {
        if (url) {
            console.log('Testing fetch to Supabase URL...');
            // Supabase URL usually doesn't return much on root, but let's see if it connects
            const res = await fetch(url);
            console.log('Fetch Supabase status:', res.status);
        }
    } catch (e) {
        console.error('Fetch Supabase failed:', e.message);
    }
}

testFetch();
