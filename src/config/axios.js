import axios from 'axios'
import { toast } from 'sonner'

const baseURL = "https://localhost:7194/api"
console.log('[API] Base URL:', baseURL)

const instance = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true' 
  }
})


let navigate = null

export const setNavigate = (navigateFunction) => {
  navigate = navigateFunction
}


instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Handle FormData (file upload)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    config.metadata = {
      startTime: performance.now()
    }

    return config
  },
  (error) => Promise.reject(error)
)

/* =========================
   Response interceptor
========================= */
instance.interceptors.response.use(
  (response) => {
    const endTime = performance.now()
    const startTime = response.config.metadata?.startTime

    const elapsedMs = startTime
      ? Number((endTime - startTime).toFixed(2))
      : null

    const fullUrl = `${response.config.baseURL}${response.config.url}`

    console.log(
      `[API RESPONSE] ${response.config.method?.toUpperCase()} ${fullUrl} | ${elapsedMs} ms`
    )

    // GẮN elapsedMs vào response
    response.elapsedMs = elapsedMs

    return response
  },
  (error) => {
    const endTime = performance.now()
    const startTime = error.config?.metadata?.startTime

    const elapsedMs = startTime
      ? Number((endTime - startTime).toFixed(2))
      : null

    const fullUrl = `${error.config?.baseURL}${error.config?.url}`

    console.log(
      `[API ERROR] ${error.config?.method?.toUpperCase()} ${fullUrl} | ${elapsedMs} ms`
    )

    if (error.response) {
      error.response.elapsedMs = elapsedMs
    }

    return Promise.reject(error)
  }
)


instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // ✅ LOG FULL URL
    const fullUrl = `${config.baseURL?.replace(/\/$/, '')}${config.url}`
    if (config.params) {
      const query = new URLSearchParams(config.params).toString()
      console.log(
        `[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}?${query}`
      )
    } else {
      console.log(
        `[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`
      )
    }

    return config
  },
  (error) => Promise.reject(error)
)


/* =========================
   API Service (no TS, no throw)
========================= */
export const apiService = {
  async get(url, params) {
    try {
      const response = await instance.get(url, { params })
      return {
        ...response.data,
        status: response.status
      }
    } catch (error) {
      return {
        succeeded: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Unknown error',
        status: error.response?.status || 500
      }
    }
  },

  async post(url, body) {
  try {
    const response = await instance.post(url, body)

    return {
      ...response.data,
      status: response.status,
      elapsedMs: response.elapsedMs
    }
  } catch (error) {
    return {
      succeeded: false,
      message:
        error.response?.data?.message ||
        error.message ||
        'Unknown error',
      status: error.response?.status || 500,
      elapsedMs: error.response?.elapsedMs
    }
  }
  },

  async put(url, body) {
    try {
      const response = await instance.put(url, body)
      return {
        ...response.data,
        status: response.status
      }
    } catch (error) {
      return {
        succeeded: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Unknown error',
        status: error.response?.status || 500
      }
    }
  },

  async patch(url, body) {
    try {
      const response = await instance.patch(url, body)
      return {
        ...response.data,
        status: response.status
      }
    } catch (error) {
      return {
        succeeded: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Unknown error',
        status: error.response?.status || 500
      }
    }
  },

  async delete(url) {
    try {
      const response = await instance.delete(url)
      return {
        ...response.data,
        status: response.status
      }
    } catch (error) {
      return {
        succeeded: false,
        message:
          error.response?.data?.message ||
          error.message ||
          'Unknown error',
        status: error.response?.status || 500
      }
    }
  }
}

export default instance


