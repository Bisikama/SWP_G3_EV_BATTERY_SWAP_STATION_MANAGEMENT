/**
 * Paginate any Sequelize model
 * @param {Model} Model - Sequelize model
 * @param {Object} filters - Sequelize where conditions
 * @param {Object} options - page, pageSize, order, attributes, include, etc.
 */
async function paginate(Model, filters = {}, options = {}) {
  const page = options.page && options.page > 0 ? options.page : 1;
  const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 10;
  
  // remove limit & offset to prevent overriding
  delete options.limit;
  delete options.offset;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const { count, rows } = await Model.findAndCountAll({
    where: filters,
    limit,
    offset,
    distinct: true,
    ...options
  });

  return {
    data: rows,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  };
}

module.exports = paginate;
