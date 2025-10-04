// src/models/user.model.js
const { sql, poolPromise } = require('../config/db');

class Driver {
  // Lấy toàn bộ driver
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM EV_Driver');
    return result.recordset;
  }

  // Lấy 1 driver theo ID
  static async getById(driverId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('DriverID', sql.Int, driverId)
      .query('SELECT * FROM EV_Driver WHERE DriverID = @DriverID');
    return result.recordset[0];
  }

  // Tạo driver mới
  static async create(driver) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('FullName', sql.NVarChar, driver.FullName)
      .input('Phone', sql.NVarChar, driver.Phone)
      .input('Email', sql.NVarChar, driver.Email)
      .input('PasswordHash', sql.NVarChar, driver.PasswordHash)
      .input('AdminID', sql.Int, driver.AdminID)
      .query(`
        INSERT INTO EV_Driver (FullName, Phone, Email, PasswordHash, AdminID) 
        VALUES (@FullName, @Phone, @Email, @PasswordHash, @AdminID)
      `);
    return result.rowsAffected[0]; // số dòng thêm thành công
  }

  // Cập nhật driver
  static async update(driverId, driver) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('DriverID', sql.Int, driverId)
      .input('FullName', sql.NVarChar, driver.FullName)
      .input('Phone', sql.NVarChar, driver.Phone)
      .input('Email', sql.NVarChar, driver.Email)
      .input('PasswordHash', sql.NVarChar, driver.PasswordHash)
      .input('AdminID', sql.Int, driver.AdminID)
      .query(`
        UPDATE EV_Driver
        SET FullName = @FullName,
            Phone = @Phone,
            Email = @Email,
            PasswordHash = @PasswordHash,
            AdminID = @AdminID
        WHERE DriverID = @DriverID
      `);
    return result.rowsAffected[0];
  }

  // Xóa driver
  static async delete(driverId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('DriverID', sql.Int, driverId)
      .query('DELETE FROM EV_Driver WHERE DriverID = @DriverID');
    return result.rowsAffected[0];
  }
}

module.exports = Driver;
