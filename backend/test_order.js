const restaurantId = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';
const baseUrl = 'http://localhost:3002/api';

async function testOrder() {
    try {
        console.log('Fetching menu from:', `${baseUrl}/menu/${restaurantId}`);
        const menuRes = await fetch(`${baseUrl}/menu/${restaurantId}`);

        console.log('Menu Status:', menuRes.status);
        const text = await menuRes.text();
        // console.log('Menu Body:', text.substring(0, 500));

        const menuData = JSON.parse(text);

        if (!Array.isArray(menuData)) {
            console.error('Menu data is not an array:', menuData);
            return;
        }

        if (menuData.length === 0) {
            console.error('Menu is empty array');
            return;
        }

        // Check structure
        const category = menuData[0];
        if (!category.items || category.items.length === 0) {
            console.error('First category has no items:', category);
            return;
        }

        const item = category.items[0];
        console.log('Ordering item:', item.name, item.id);

        const payload = {
            restaurantId,
            tableId: null,
            items: [{ itemId: item.id, quantity: 1, portion: 'full' }],
            customerName: "Debug User",
            orderType: "takeaway"
        };

        const orderRes = await fetch(`${baseUrl}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const orderText = await orderRes.text();
        console.log('Order Response:', orderRes.status, orderText);

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testOrder();
