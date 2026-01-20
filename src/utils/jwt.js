import { jwtDecode } from 'jwt-decode'

// .NET claim URIs
const CLAIM_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

// helper: role đôi khi là string hoặc array
const pickRole = (decoded) => {
  const role = decoded?.[CLAIM_ROLE] ?? decoded?.role
  if (Array.isArray(role)) return role[0]
  return role
}

/**
 * Decode JWT token and extract user information
 * Supports both .NET Identity claims and standard JWT claims
 */
export const decodeToken = (token) => {
  try {
    const decoded = jwtDecode(token)

    const id = decoded?.[CLAIM_ID] ?? decoded?.id ?? decoded?.sub
    const email = decoded?.[CLAIM_EMAIL] ?? decoded?.email
    const role = pickRole(decoded)

    if (!id || !email || !role) {
      console.error('JWT token missing required fields:', { id, email, role, decoded })
      return null
    }

    return { id, email, role }
  } catch (error) {
    console.error('Error decoding JWT token:', error)
    return null
  }
}

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token)
    if (!decoded?.exp) return false

    // exp là giây (seconds)
    const now = Date.now() / 1000
    return decoded.exp < now
  } catch (error) {
    console.error('Error checking token expiration:', error)
    return true
  }
}

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token) => {
  try {
    const decoded = jwtDecode(token)
    if (!decoded?.exp) return null
    return new Date(decoded.exp * 1000)
  } catch (error) {
    console.error('Error getting token expiration:', error)
    return null
  }
}


/**
 * Validate JWT token format and structure
 */
export const isValidJWT = (token) => {
  try {
    if (typeof token !== 'string') return false
    const parts = token.split('.')
    if (parts.length !== 3) return false

    const decoded = jwtDecode(token)

    const hasId = decoded?.[CLAIM_ID] ?? decoded?.id ?? decoded?.sub
    const hasEmail = decoded?.[CLAIM_EMAIL] ?? decoded?.email
    const hasRole = pickRole(decoded)

    return !!(hasId && hasEmail && hasRole)
  } catch {
    return false
  }
}

export const getTokenExpireMs = (token) => {
  try {
    const decoded = jwtDecode(token)
    if (!decoded?.exp) return null
    const ms = decoded.exp * 1000 - Date.now()
    return ms
  } catch {
    return 0
  }
}

