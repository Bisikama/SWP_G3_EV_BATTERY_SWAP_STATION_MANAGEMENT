const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');

async function findAll(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { role, email, fullname } = req.query;

  const result = await userService.findAll(page, pageSize, { role, email, fullname });

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

async function findById(req, res) {
  const { id } = req.params;
  if (!id) throw new ApiError(400, 'Id is required');

  const user = await userService.findById(id);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json({
    success: true,
    payload: { user },
  });
}

async function findByEmail(req, res) {
  const { email } = req.params;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await userService.findByEmail(email);
  if (!user) throw new ApiError(404, 'User not found');

  return res.status(200).json({
    success: true,
    payload: { user },
  });
}

async function createStaff(req, res) {
  const data = req.body;
  if (!data.email || !data.password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const newStaff = await userService.createStaff(data);

  return res.status(201).json({
    success: true,
    message: 'Staff account created successfully',
    payload: { user: newStaff },
  });
}

async function updateDriver(req, res) {
  const user = req.user; // assuming authenticated user info is in req.user
  const data = req.body;

  const updatedUser = await userService.updateDriver(user, data);

  return res.status(200).json({
    success: true,
    message: 'Driver updated successfully',
    payload: { user: updatedUser },
  });
}

async function updateDriverPassword(req, res) {
  const user = req.user;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const result = await userService.updateDriverPassword(user, oldPassword, newPassword, confirmPassword);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
}

async function updateUserStatus(req, res) {
  const { account_id } = req.params;
  const { status } = req.body;

  if (!account_id) throw new ApiError(400, 'accountId is required');
  if (!status) throw new ApiError(400, 'status is required');

  const updated = await userService.updateUserStatus(account_id, status);
  if (!updated) {
    throw new ApiError(404, 'User not found or is admin');
  }

  return res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    payload: { user: updated }
  });
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  createStaff,
  updateDriver,
  updateDriverPassword,
  updateUserStatus
};
