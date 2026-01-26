// src/components/user/Avatar.jsx
import React, { useMemo } from 'react'
import { parseFileRefs } from '../../../utils/fileUtill' // ✅ dùng đúng util bạn đang có

// lấy url ảnh đầu tiên từ avatarImg (JSON fileRefs hoặc url thẳng)
function firstImageUrl(seed) {
  if (!seed) return ''

  // 1) nếu là url thẳng
  if (typeof seed === 'string' && /^(https?:)?\/\//i.test(seed)) return seed

  // 2) thử parse JSON fileRefs (string)
  try {
    const refs = parseFileRefs(seed) || []
    const first = refs[0]
    return first?.url || first?.Url || ''
  } catch {
    // 3) fallback: nếu seed là string nhưng không phải URL, vẫn thử dùng như URL relative
    if (typeof seed === 'string') return seed
    return ''
  }
}

function initialsFromName(name) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')
  return initials || '?'
}

/**
 * Avatar component (parse lấy ảnh đầu tiên)
 * Props:
 * - name: string
 * - seed: avatarImg string (url hoặc JSON fileRefs)
 * - size: 'sm' | 'md' | 'lg'
 */
export default function SquareAvatar({ name, seed, size = 'md' }) {
  const imgUrl = useMemo(() => firstImageUrl(seed), [seed])

  const sizeClass =
    size === 'sm'
      ? 'h-8 w-8 text-xs'
      : size === 'lg'
      ? 'h-14 w-14 text-base'
      : 'h-12 w-12 text-sm'

  if (imgUrl) {
    return <img src={imgUrl} alt={name} className={`${sizeClass} rounded object-cover`} />
  }

  return (
    <div className={`${sizeClass} rounded bg-slate-200 flex items-center justify-center font-semibold text-[#334155]`}>
      {initialsFromName(name)}
    </div>
  )
}
