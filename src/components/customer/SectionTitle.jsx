import { NavLink } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-800">
          {title}
        </h2>
        {subtitle && (
          <p className="text-slate-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <NavLink
          to={action.to}
          className="inline-flex items-center gap-1 text-[#0090D0] hover:text-[#0077B0] font-semibold transition-colors"
        >
          {action.label}
          <ChevronRight size={20} />
        </NavLink>
      )}
    </div>
  )
}
