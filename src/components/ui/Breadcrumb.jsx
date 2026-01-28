import React from 'react'
import { FiHome, FiChevronRight } from 'react-icons/fi'


export default function Breadcrumb({ 
  items = [], 
  showHome = true,
  separator = 'chevron' // 'chevron', 'slash', 'dot'
}) {
  const Separator = () => {
    if (separator === 'slash') {
      return <span className="text-slate-300 mx-2">/</span>
    }
    if (separator === 'dot') {
      return <span className="text-slate-300 mx-2">•</span>
    }
    return <FiChevronRight className="text-slate-300 mx-1" size={14} />
  }

  return (
    <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1
        const isFirst = idx === 0

        return (
          <React.Fragment key={idx}>
            {idx > 0 && <Separator />}
            
            {item.href && !isLast ? (
              <a 
                href={item.href}
                className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors group"
              >
                {isFirst && showHome && (
                  <FiHome 
                    size={14} 
                    className="text-slate-400 group-hover:text-blue-500 transition-colors" 
                  />
                )}
                <span className="font-medium">{item.label}</span>
              </a>
            ) : (
              <span 
                className={`flex items-center gap-1.5 ${
                  isLast 
                    ? 'text-slate-700 font-semibold' 
                    : 'text-slate-500'
                }`}
              >
                {isFirst && showHome && !item.href && (
                  <FiHome size={14} className="text-slate-400" />
                )}
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}