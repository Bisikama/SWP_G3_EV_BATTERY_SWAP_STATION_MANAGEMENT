const cors = require('cors');
require('dotenv').config();

const options = {
  origin: [
    'http://localhost:5173',
    `http://localhost:${process.env.PORT}`,
    ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(options);