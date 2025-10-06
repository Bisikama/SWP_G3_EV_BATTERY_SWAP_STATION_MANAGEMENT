const express = require('express');
require('dotenv').config();
const { connectDB } = require('./src/config/db')

const app = express();
app.use(express.json());

connectDB();

// routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// start server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
