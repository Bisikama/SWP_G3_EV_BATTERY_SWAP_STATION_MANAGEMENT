const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// start server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
