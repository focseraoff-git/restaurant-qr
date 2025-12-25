const http = require('http');

const id = 'efdea58f-4ef5-4d79-86bc-8f5e61f4336b';
const url = `http://localhost:3002/api/menu/${id}`;

console.log(`Checking URL: ${url}`);

http.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Body:', data));
}).on('error', (err) => {
    console.error('Error:', err.message);
});
