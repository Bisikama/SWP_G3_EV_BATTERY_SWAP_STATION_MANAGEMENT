module.exports = function (Model) {
  /**
   * Paginate function for any Sequelize model
   * @param {Object} filter - Sequelize where conditions
   * @param {Object} options - page, pageSize, order, attributes, include, etc.
   */
  Model.paginate = async function (filter = {}, options = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize = options.pageSize && options.pageSize > 0 ? options.pageSize : 10;
    const offset = (page - 1) * pageSize;
    const limit = pageSize;
    const order = options.order || [[this.primaryKeyAttribute, 'ASC']];

    const { count, rows } = await this.findAndCountAll({
      where: filter,
      limit,
      offset,
      order,
      ...options
    });

    return {
      data: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  };
};
