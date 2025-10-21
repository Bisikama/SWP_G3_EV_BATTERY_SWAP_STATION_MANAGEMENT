require('dotenv').config();

module.exports = {
  "development": {
    "username": process.env.REMOTE_DB_USER,
    "password": process.env.REMOTE_DB_PASS,
    "database": process.env.REMOTE_DB_NAME,
    "host": process.env.REMOTE_DB_HOST,
    "dialect": "postgres"
  },
  "demo": {
    "username": process.env.LOCAL_DB_USER,
    "password": process.env.LOCAL_DB_PASS,
    "database": process.env.LOCAL_DB_NAME,
    "host": process.env.LOCAL_DB_HOST,
    "dialect": "mssql"
  },
  "production": {
    "username": process.env.REMOTE_DB_USER,
    "password": process.env.REMOTE_DB_PASS,
    "database": process.env.REMOTE_DB_NAME,
    "host": process.env.REMOTE_DB_HOST,
    "dialect": "postgres"
  }
}
