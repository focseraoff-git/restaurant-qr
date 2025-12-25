
const axios = require('axios');

async function run() {
    try {
        const url = "http://localhost:3002/api/orders/active?restaurantId=5331ded5-6ab3-43cf-b64e-dbfdb6a215eb&customerName=Uday&tableNumber=9";
        console.log("Fetching:", url);
        await axios.get(url);
    } catch (e) {
        if (e.response) {
            console.log("Status:", e.response.status);
            console.log("Data:", JSON.stringify(e.response.data));
        } else {
            console.error(e.message);
        }
    }
}
run();
