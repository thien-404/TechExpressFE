import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../store/authContext'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, user} = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
