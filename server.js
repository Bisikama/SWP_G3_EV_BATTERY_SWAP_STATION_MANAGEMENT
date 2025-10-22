const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerDocs, swaggerUiOptions } = require('./src/config/swagger.config');
const cors = require('./src/config/cors.config');
require('dotenv').config();

const errorHandler = require('./src/middlewares/errorHandler');

const userRoutes = require('./src/routes/user.route');
const vehicleRoutes = require('./src/routes/vehicles.route');
const batteryRoutes = require('./src/routes/battery.route');
const subscriptionRoutes = require('./src/routes/subscriptions.route');
const batteryTypeRoutes = require('./src/routes/battery-types.route');
const vehicleModelRoutes = require('./src/routes/vehicle-models.route');
const subscriptionPlanRoutes = require('./src/routes/subscription-plans.route');
const stationRoutes = require('./src/routes/stations.route');
const supportTicketsRoutes = require('./src/routes/support-tickets.route');
const paymentRoutes = require('./src/routes/payment.route');
const shiftRoutes = require('./src/routes/shifts.route');
const invoiceRoutes = require('./src/routes/invoice.route');
const bookingRoutes = require('./src/routes/booking.route');

const app = express();
app.use(express.json());
app.use(cors);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));

// routes
app.use('/api/user', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/battery', batteryRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/battery-type', batteryTypeRoutes);
app.use('/api/vehicle-model', vehicleModelRoutes);
app.use('/api/subscription-plan', subscriptionPlanRoutes);
app.use('/api/station', stationRoutes);
app.use('/api/support-ticket', supportTicketsRoutes);
app.use('/api/shift', shiftRoutes);
app.use('/api/booking', bookingRoutes);

app.use('/api/payment', paymentRoutes);
app.use('/api/invoice', invoiceRoutes);

// catch errors
app.use(errorHandler);

// start server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
