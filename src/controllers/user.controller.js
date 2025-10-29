const userService = require('../services/user.service');
const ApiError = require('../utils/ApiError');

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

async function findAllDrivers(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const result = await userService.findAllDriver(page, pageSize);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

async function findAllStaff(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;

  const result = await userService.findAllStaff(page, pageSize);

  return res.status(200).json({
    success: true,
    payload: result,
  });
}

module.exports = {
  findById,
  findByEmail,
  findAllDrivers,
  findAllStaff,
};
