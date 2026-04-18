
const axios = require('axios');

async function testApi() {
    try {
        console.log('--- Testing Login ---');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'kavyasekar0099@gmail.com',
            password: 'adminpassword123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token received.');

        const authHeader = { headers: { 'Authorization': `Bearer ${token}` } };

        console.log('\n--- Testing Protected Admin Route (/api/admin/stats) ---');
        const statsRes = await axios.get('http://localhost:5000/api/admin/stats', authHeader);
        console.log('Admin Stats Success. Total Products in stats:', statsRes.data.totalProducts);

        console.log('\n--- Testing Inventory CRUD (Admin) ---');
        // Create
        const newProduct = {
            product_name: 'Test Product ' + Date.now(),
            category: 'Equipment',
            price: 100,
            stock_quantity: 10,
            description: 'Temporary test product'
        };
        const createRes = await axios.post('http://localhost:5000/api/products', newProduct, authHeader);
        const testProductId = createRes.data._id;
        console.log('Product created with ID:', testProductId);

        // Update
        await axios.put(`http://localhost:5000/api/products/${testProductId}`, { stock_quantity: 15 }, authHeader);
        console.log('Product updated successfully.');

        // Delete
        await axios.delete(`http://localhost:5000/api/products/${testProductId}`, authHeader);
        console.log('Product deleted successfully.');

        console.log('\n--- Testing Bookings Fetch ---');
        const bookingsRes = await axios.get('http://localhost:5000/api/bookings/all', authHeader);
        console.log(`Found ${bookingsRes.data.length} bookings.`);

        console.log('\n--- ALL CRITICAL API TESTS PASSED ---');
    } catch (error) {
        console.error('API Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
        process.exit(1);
    }
}

testApi();
