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
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(options);
