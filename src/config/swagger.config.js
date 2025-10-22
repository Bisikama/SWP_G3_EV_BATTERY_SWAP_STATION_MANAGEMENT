const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const docs = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Battery Swap API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT}`, description: 'Local server' },
      { url: 'https://api.example.com', description: 'Hosting server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      }
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

const swaggerDocs = swaggerJsDoc(docs);

const swaggerUiOptions = {
  swaggerOptions: {
    operationsSorter: 'alpha',
    tagsSorter: 'alpha',
  },
};

module.exports = { swaggerDocs, swaggerUiOptions };

