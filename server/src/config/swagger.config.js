const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const options = {
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
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            account_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            username: { type: 'string', example: 'john.admin' },
            email: { type: 'string', example: 'john.admin@evswap.com' },
            fullname: { type: 'string', example: 'John Admin' },
            phone_number: { type: 'string', example: '123456789' },
            permission: { type: 'string', example: 'user' },
            status: { type: 'string', example: 'active' },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

module.exports = swaggerJsDoc(options);

