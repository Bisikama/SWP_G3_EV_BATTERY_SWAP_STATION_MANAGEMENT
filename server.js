// server.js
const express = require('express');
require('dotenv').config();

const userRoutes = require('./src/routes/user.route');

const app = express();
app.use(express.json());

// routes
app.use('/api', userRoutes);

// start server
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});
