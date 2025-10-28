const db = require('../models');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const paginate = require('../utils/paginate');
paginate(db.Account);

async function findAll(page = 1, pageSize = 10, query = {}) {
  return db.Account.paginate(
    query,
    {
      page,
      pageSize,
      attributes: { exclude: ['password_hash'] },
      order: [['account_id', 'ASC']]
    }
  );
}

async function findAllDriver(page = 1, pageSize = 10) {
  return findAll(page, pageSize, {
    role: 'driver'
  });
}

async function findAllStaff(page = 1, pageSize = 10) {
  return findAll(page, pageSize, {
    role: 'staff'
  });
}

async function findById(id) {
  if (!id) return null;
  return db.Account.findByPk(id, {
    attributes: {
      exclude: ['password_hash']
    }
  });
}

async function findByEmail(email) {
  if (!email) return null;
  return db.Account.findOne({
    where: { email },
    attributes: {
      exclude: ['password_hash']
    }
  });
}

async function createStaff(data) {
  const emailExists = await db.Account.findOne({ where: { email: data.email } });
  if (emailExists) {
    throw new ApiError(400, 'Email already registered');
  }
  const phoneExists = await db.Account.findOne({ where: { phone_number: data.phone_number } });
  if (phoneExists) {
    throw new ApiError(400, 'Phone number already registered');
  }
  let newAccount;
  const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  data.password_hash = hash;
  data.role = 'staff';
  delete data.password;
  newAccount = await db.Account.create(data);
  return findById(newAccount.account_id);
}

async function updateDriverPassword(user, oldPassword, newPassword, confirmPassword) {
  const account = await db.Account.findByPk(user.account_id);
  if (!account) throw new ApiError(404, 'Account not found');

  const match = await bcrypt.compare(oldPassword, account.password_hash);
  if (!match) throw new ApiError(400, 'Old password is incorrect');

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, 'New password and confirm password do not match');
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await account.update({ password_hash: hash });

  return { message: 'Password updated successfully' };
}

async function updateDriver(user, data) {
  const { fullname, phone_number, citizen_id, driving_license } = data;

  const account = await db.Account.findByPk(user.account_id);
  if (!account) throw new ApiError(404, 'Account not found');

  await account.update({ fullname, phone_number, citizen_id, driving_license });

  return findById(user.account_id);
}

module.exports = { findAllDriver, findAllStaff, findById, findByEmail, createStaff, updateDriver, updateDriverPassword };
