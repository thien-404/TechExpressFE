import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { decodeToken, isTokenExpired, isValidJWT } from '../utils/jwt'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const logoutTimerRef = useRef(null)

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
  }

  const logout = useCallback(() => {
    clearLogoutTimer()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const scheduleAutoLogout = useCallback((jwt) => {
    clearLogoutTimer()

    try {
      const decoded = jwtDecode(jwt)
      if (!decoded?.exp) return

      const msLeft = decoded.exp * 1000 - Date.now()

      // nếu đã hết hạn thì logout ngay
      if (msLeft <= 0) {
        logout()
        return
      }

      // ✅ trừ 1 chút "buffer" để tránh lệch giờ (optional)
      const bufferMs = 1000
      logoutTimerRef.current = setTimeout(() => {
        logout()
      }, Math.max(0, msLeft - bufferMs))
    } catch {
      // token lỗi thì logout cho an toàn
      logout()
    }
  }, [logout])

  // Load token từ localStorage khi mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      try {
        if (!isValidJWT(savedToken) || isTokenExpired(savedToken)) {
          logout()
          setLoading(false)
          return
        }

        const decodedUser = decodeToken(savedToken)
        if (decodedUser) {
          setToken(savedToken)
          setUser(decodedUser)
          scheduleAutoLogout(savedToken) // ✅ set timer ngay khi load
        } else {
          logout()
        }
      } catch (error) {
        console.error('Error processing saved token:', error)
        logout()
      }
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = (newToken) => {
    if (!isValidJWT(newToken)) throw new Error('Invalid JWT token format')
    if (isTokenExpired(newToken)) throw new Error('JWT token has expired')

    const decodedUser = decodeToken(newToken)
    if (!decodedUser) throw new Error('Failed to decode JWT token')

    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(decodedUser))

    setToken(newToken)
    setUser(decodedUser)

    scheduleAutoLogout(newToken) // ✅ set timer khi login
  }

  // ✅ nếu token bị set/clear ở nơi khác, cũng schedule/clear theo
  useEffect(() => {
    if (!token) {
      clearLogoutTimer()
      return
    }
    scheduleAutoLogout(token)
  }, [token, scheduleAutoLogout])

  // cleanup khi unmount
  useEffect(() => {
    return () => clearLogoutTimer()
  }, [])

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
