// const cors = require('cors');
// require('dotenv').config();

// const options = {
//   origin: [
//     'http://localhost:3000',
//     `http://localhost:${process.env.PORT}`,
//     ],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
//   optionsSuccessStatus: 200
// };

// module.exports = cors(options);

const cors = require('cors');

const options = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Cho phép request nội bộ như Postman
    if (origin.startsWith('http://localhost')) {
      callback(null, true); //  Cho phép mọi localhost:* gọi tới
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(options);
