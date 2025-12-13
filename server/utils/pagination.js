/**
 * Pagination Helper Utilities
 * Provides reusable pagination logic for API routes
 */

/**
 * Parse pagination parameters from request query
 * @param {object} query - The request query object
 * @param {object} options - Default options
 * @returns {object} Pagination parameters
 */
const parsePaginationParams = (query, options = {}) => {
    const {
        defaultLimit = 20,
        maxLimit = 100,
        defaultSort = { createdAt: -1 }
    } = options;

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
    const skip = (page - 1) * limit;

    // Parse sort parameter (e.g., "name:asc" or "-createdAt")
    let sort = defaultSort;
    if (query.sort) {
        const [field, order] = query.sort.split(':');
        sort = { [field]: order === 'desc' ? -1 : 1 };
    }

    // Parse search parameter
    const search = query.search || null;

    return { page, limit, skip, sort, search };
};

/**
 * Build pagination response metadata
 * @param {number} total - Total count of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const buildPaginationMeta = (total, page, limit) => {
    const pages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
    };
};

/**
 * Apply pagination to a Mongoose query
 * @param {Query} query - Mongoose query object
 * @param {object} pagination - Pagination parameters
 * @returns {Query} Modified query
 */
const applyPagination = (query, { skip, limit, sort }) => {
    return query.skip(skip).limit(limit).sort(sort);
};

/**
 * Build search filter for text fields
 * @param {string} search - Search term
 * @param {string[]} fields - Fields to search in
 * @returns {object} MongoDB filter object
 */
const buildSearchFilter = (search, fields) => {
    if (!search || !fields.length) return {};

    return {
        $or: fields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
        }))
    };
};

module.exports = {
    parsePaginationParams,
    buildPaginationMeta,
    applyPagination,
    buildSearchFilter
};
