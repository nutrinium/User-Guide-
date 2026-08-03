export function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit))
  const sort = query.sort || 'name'
  const order = query.order?.toLowerCase() === 'desc' ? 'desc' : 'asc'
  const offset = (page - 1) * limit
  return { page, limit, sort, order, offset }
}

export function paginate(items, { page, limit }) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const data = items.slice((page - 1) * limit, page * limit)
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export function sortItems(items, sortKey, order = 'asc') {
  const dir = order === 'desc' ? -1 : 1
  return [...items].sort((a, b) => {
    const av = a[sortKey] ?? ''
    const bv = b[sortKey] ?? ''
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir
  })
}
