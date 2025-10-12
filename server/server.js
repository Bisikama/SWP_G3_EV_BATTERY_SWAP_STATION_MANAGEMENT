const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./src/config/swagger.config');
require('dotenv').config();

const userRoutes = require('./src/routes/user.route');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// routes
app.use('/api/user', userRoutes);



// start server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
