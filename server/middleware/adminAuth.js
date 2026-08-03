export function requireAdminSecret(req, res, next) {
  const secret = process.env.ADMIN_API_SECRET
  if (!secret) return next()

  const provided = req.headers['x-admin-secret']
  if (provided !== secret) {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' })
  }
  next()
}
