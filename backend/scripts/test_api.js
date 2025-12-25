const https = require('http');

const url = 'http://localhost:3000/api/tables/08fa6430-54ed-49fe-8d6d-1fe1230d4c38';

console.log(`Fetching ${url}...`);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Body:', data);
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
