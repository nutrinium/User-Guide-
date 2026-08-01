import Card from './Card'

function StatCard({ title, value, icon: Icon, iconBg, iconColor }) {
  return (
    <Card className="flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={22} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-white">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
  )
}

export default StatCard
