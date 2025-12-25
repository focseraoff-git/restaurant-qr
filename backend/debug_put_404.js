const http = require('http');

const id = 'efdea58f-4ef5-4d79-86bc-8f5e61f4336b';
const postData = JSON.stringify({
    name: "Debug Updated Name",
    price_full: 999,
    description: "Debug Updated Description",
    is_veg: true
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: `/api/menu/${id}`,
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log(`Testing PUT ${options.path}...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
