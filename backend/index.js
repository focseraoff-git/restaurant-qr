require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3002; // Hardcoded new port

// Test Route
app.get('/test', (req, res) => res.send('SERVER_IS_ALIVE'));

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Client (Initialized here or imported)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey); // Moved to config/supabaseClient.js

// Routes
const ordersRoutes = require('./routes/orders.routes');
const menuRoutes = require('./routes/menu.routes');
const waitersRoutes = require('./routes/waiters.routes');
const paymentsRoutes = require('./routes/payments.routes');
const tablesRoutes = require('./routes/tables.routes');
const restaurantsRoutes = require('./routes/restaurants.routes');

console.log('Registering routes...');
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/waiters', waitersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tables', tablesRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant QR System API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
