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
const staffRoutes = require('./routes/staff.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const advancesRoutes = require('./routes/advances.routes');
const payrollRoutes = require('./routes/payroll.routes');
const vendorsRoutes = require('./routes/vendors.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const movementsRoutes = require('./routes/movements.routes');
const purchasesRoutes = require('./routes/purchases.routes');
const billingRoutes = require('./routes/billing.routes');
const khataRoutes = require('./routes/khata.routes');
const cancellationsRoutes = require('./routes/cancellations.routes');
const offersRoutes = require('./routes/offers.routes');

console.log('Registering routes...');
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/waiters', waitersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advances', advancesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/vendors', vendorsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', movementsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/khata', khataRoutes);
app.use('/api/cancellations', cancellationsRoutes);
app.use('/api/offers', offersRoutes);

app.get('/', (req, res) => {
  res.send('Restaurant QR System API is running');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
