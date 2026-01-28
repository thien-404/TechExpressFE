import React from 'react'
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiShoppingBag,
  FiSave
} from 'react-icons/fi'
import SquareAvatar from '../../../../components/ui/avatar/SquareAvatar'
import UserStatus from '../../../../components/ui/icon/ActiveStatus'

/* =========================
 * Reusable UI
 * ========================= */
const Box = ({ title, children, gradient = false, icon: Icon }) => (
  <div className={`rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
    gradient 
      ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' 
      : 'border-slate-200 bg-white'
  }`}>
    <div className={`px-4 py-3 border-b flex items-center gap-2 ${
      gradient 
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400' 
        : 'bg-gradient-to-r from-slate-50 to-white text-slate-700 border-slate-200'
    }`}>
      {Icon && <Icon size={16} className={gradient ? 'text-white' : 'text-blue-500'} />}
      <span className="text-sm font-semibold">{title}</span>
    </div>
    <div className="p-4 space-y-2">{children}</div>
  </div>
)

const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${
    highlight ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'
  }`}>
    <div className="flex items-center gap-2 text-slate-600 text-sm">
      {Icon && <Icon size={16} className="text-blue-500" />}
      {label}
    </div>
    <div className={`text-sm font-medium text-right ${
      highlight ? 'text-blue-600' : 'text-slate-700'
    }`}>
      {value || '-'}
    </div>
  </div>
)

const StatCard = ({ icon: Icon, value, label, color = 'blue' }) => {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50',
    green: 'from-green-500 to-green-600 bg-green-50',
    purple: 'from-purple-500 to-purple-600 bg-purple-50',
    orange: 'from-orange-500 to-orange-600 bg-orange-50'
  }
  return (
    <div className={`rounded-xl p-4 ${colorMap[color].split(' ')[1]} border border-${color}-200 hover:shadow-md transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${colorMap[color].split(' ')[0]} text-white shadow-sm`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className={`font-bold text-lg text-${color}-600`}>{value}</div>
          <div className="text-xs text-slate-600 mt-0.5">{label}</div>
        </div>
      </div>
    </div>
  )
}

/* =========================
 * User Info Tab
 * ========================= */
export default function UserInfoTab({ user }) {
  if (!user) return null

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const address = `${user.address || ''}, ${user.ward || ''}, ${user.province || ''}`.trim()

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-slate-100 text-slate-600 border-slate-200',
      pending: 'bg-orange-100 text-orange-700 border-orange-200'
    }
    return colors[status?.toLowerCase()] || colors.inactive
  }

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      user: 'bg-blue-100 text-blue-700 border-blue-200',
      moderator: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    }
    return colors[role?.toLowerCase()] || colors.user
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* ================= LEFT COLUMN ================= */}
      <div className="lg:col-span-3 space-y-4">
        {/* Avatar */}
        <Box title="Ảnh đại diện" gradient={true}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <SquareAvatar
                name={fullName || user.email}
                seed={user.avatarImage}
                size="lg"
              />
              <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
                <UserStatus status={user.status} />
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-slate-800">{fullName || 'N/A'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>

            <div className="flex gap-2 w-full">
              <span className={`flex-1 text-center rounded-lg px-3 py-1.5 text-xs font-medium border ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
              <span className={`flex-1 text-center rounded-lg px-3 py-1.5 text-xs font-medium border ${getRoleColor(user.role)}`}>
                {user.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              <StatCard 
                icon={FiShoppingBag}
                value="0"
                label="Đơn Hàng"
                color="orange"
              />
              <StatCard 
                icon={FiSave}
                value="0"
                label="Cấu hình"
                color="purple"
              />
            </div>
          </div>
        </Box>
      </div>

      {/* ================= RIGHT COLUMN ================= */}
      <div className="lg:col-span-9 space-y-4">
        {/* Header info */}
        <Box title={fullName || user.email} icon={FiUser}>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <FiClock className="text-blue-500" size={14} />
              <span className="text-slate-600">Tham gia:</span>
              <span className="font-medium text-slate-700">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString('vi-VN')
                  : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-500" size={14} />
              <UserStatus status={user.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-4 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 text-green-100 text-xs mb-1">
                <FiCreditCard size={14} />
                Tổng Chi Tiêu
              </div>
              <div className="font-bold text-xl">54,480,000 ₫</div>
              <div className="text-xs text-green-100 mt-1">Sẽ được làm sau</div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-4 border border-slate-300 hover:shadow-md transition-shadow">
              <div className="text-slate-600 text-xs mb-1">User ID</div>
              <div className="font-mono font-semibold text-sm text-slate-700 break-all">
                {user.id}
              </div>
            </div>
          </div>
        </Box>

        {/* Contact */}
        <Box title="Liên hệ" icon={FiPhone}>
          <InfoRow
            icon={FiMail}
            label="Gmail"
            value={user.email}
            highlight={true}
          />
          <InfoRow
            icon={FiPhone}
            label="Số điện thoại"
            value={user.phone}
          />
          <InfoRow
            icon={FiMapPin}
            label="Địa chỉ"
            value={address}
          />
        </Box>

        {/* Personal info */}
        <Box title="Thông tin cá nhân" icon={FiUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow
              label="Họ & Tên"
              value={fullName}
              highlight={true}
            />
            <InfoRow
              label="Giới tính"
              value={user.gender || '-'}
            />
            <InfoRow
              label="Mã Căn cước/CMT"
              value={user.identity || '-'}
            />
            <InfoRow
              label="Trạng thái tài khoản"
              value={user.status}
            />
          </div>
        </Box>
      </div>
    </div>
  )
}