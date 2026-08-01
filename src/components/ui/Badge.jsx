function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-white',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-white dark:ring-emerald-800',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-white dark:ring-amber-800',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-white dark:ring-blue-800',
    draft: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-white dark:ring-slate-600',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export default Badge
