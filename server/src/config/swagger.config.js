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
            email: { type: 'string', example: 'john.admin@evswap.com' },
            fullname: { type: 'string', example: 'John Admin' },
            phone_number: { type: 'string', example: '123456789' },
            permission: { type: 'string', example: 'user' },
            status: { type: 'string', example: 'active' },
          },
        },
        Invoice: {
          type: 'object',
          properties: {
            invoice_id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            driver_id: {
              type: 'string',
              format: 'uuid',
              example: '660e8400-e29b-41d4-a716-446655440001'
            },
            subscription_id: {
              type: 'string',
              format: 'uuid',
              example: '770e8400-e29b-41d4-a716-446655440002'
            },
            invoice_number: {
              type: 'string',
              example: 'INV-20250118-12345'
            },
            create_date: {
              type: 'string',
              format: 'date',
              example: '2025-01-18'
            },
            due_date: {
              type: 'string',
              format: 'date',
              example: '2025-02-17'
            },
            total_fee: {
              type: 'integer',
              example: 299000
            },
            payment_status: {
              type: 'string',
              enum: ['paid', 'unpaid'],
              example: 'unpaid'
            }
          }
        },
        InvoiceWithDetails: {
          type: 'object',
          properties: {
            invoice_id: {
              type: 'string',
              format: 'uuid'
            },
            driver_id: {
              type: 'string',
              format: 'uuid'
            },
            subscription_id: {
              type: 'string',
              format: 'uuid'
            },
            invoice_number: {
              type: 'string',
              example: 'INV-20250118-12345'
            },
            create_date: {
              type: 'string',
              format: 'date'
            },
            due_date: {
              type: 'string',
              format: 'date'
            },
            total_fee: {
              type: 'integer'
            },
            payment_status: {
              type: 'string',
              enum: ['paid', 'unpaid']
            },
            driver: {
              type: 'object',
              properties: {
                account_id: { type: 'string', format: 'uuid' },
                username: { type: 'string' },
                email: { type: 'string' },
                fullname: { type: 'string' },
                phone_number: { type: 'string' }
              }
            },
            subscription: {
              type: 'object',
              properties: {
                subscription_id: { type: 'string', format: 'uuid' },
                start_date: { type: 'string', format: 'date' },
                end_date: { type: 'string', format: 'date' },
                plan: {
                  type: 'object',
                  properties: {
                    plan_id: { type: 'integer' },
                    plan_name: { type: 'string' },
                    price: { type: 'integer' },
                    duration: { type: 'integer' }
                  }
                },
                vehicle: {
                  type: 'object',
                  properties: {
                    vehicle_id: { type: 'string', format: 'uuid' },
                    plate_number: { type: 'string' },
                    brand: { type: 'string' },
                    vin: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
    },
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

module.exports = swaggerJsDoc(options);

