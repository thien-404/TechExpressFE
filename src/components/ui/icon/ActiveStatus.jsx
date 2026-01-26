import React from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

const normalizeStatus = (status) => {
  if (status == null) return 'Inactive'

  // number enum: 0/1/2
  if (typeof status === 'number') {
    if (status === 0) return 'Active'
    if (status === 1) return 'Inactive'
    if (status === 2) return 'Deleted'
    return 'Inactive'
  }

  // string enum: "Active" | "Inactive" | "Deleted"
  const s = String(status).trim().toLowerCase()
  if (s === 'active') return 'Active'
  if (s === 'inactive') return 'Inactive'
  if (s === 'deleted') return 'Deleted'
  return 'Inactive'
}

export default function UserStatus({ status }) {
  const s = normalizeStatus(status)

  if (s === 'Active') {
    return (
      <span className="inline-flex items-center gap-2 text-emerald-600" title="Active">
        <FiCheckCircle />
      </span>
    )
  }

  if (s === 'Deleted') {
    return (
      <span className="inline-flex items-center gap-2 text-slate-400" title="Deleted">
        <FiXCircle />
      </span>
    )
  }

  // Inactive
  return (
    <span className="inline-flex items-center gap-2 text-amber-600" title="Inactive">
      <FiXCircle />
    </span>
  )
}
