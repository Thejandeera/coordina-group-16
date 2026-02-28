const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL in frontend environment variables.')
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'accessTokenExpiresAt'
const USER_DATA_KEY = 'userData'

const toAbsoluteUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `${API_BASE_URL}${path}`
}

export const getAuthTokens = () => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  accessTokenExpiresAt: localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY),
})

export const setAuthTokens = ({ accessToken, refreshToken, accessTokenExpiresAt }) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
  if (accessTokenExpiresAt) {
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_AT_KEY, accessTokenExpiresAt)
  }
}

export const clearAuthTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
}

export const getSessionUserData = () => {
  const raw = sessionStorage.getItem(USER_DATA_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    sessionStorage.removeItem(USER_DATA_KEY)
    return null
  }
}

export const setSessionUserData = (userData) => {
  sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(userData))
}

export const clearSessionUserData = () => {
  sessionStorage.removeItem(USER_DATA_KEY)
}

export const apiFetch = async (path, options = {}) => {
  return fetch(toAbsoluteUrl(path), options)
}

export const readJsonSafe = async (response) => {
  const raw = await response.text()
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const refreshAccessToken = async () => {
  const { refreshToken } = getAuthTokens()
  if (!refreshToken) {
    throw new Error('No refresh token found.')
  }

  const response = await fetch(toAbsoluteUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    clearAuthTokens()
    clearSessionUserData()
    throw new Error('Session expired. Please login again.')
  }

  const data = await readJsonSafe(response)
  if (!data?.accessToken) {
    clearAuthTokens()
    clearSessionUserData()
    throw new Error('Session expired. Please login again.')
  }
  setAuthTokens(data)

  return data.accessToken
}

export const authFetch = async (path, options = {}) => {
  const url = toAbsoluteUrl(path)
  const { accessToken } = getAuthTokens()

  const requestHeaders = new Headers(options.headers ?? {})
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const requestInit = {
    ...options,
    headers: requestHeaders,
  }

  let response = await fetch(url, requestInit)
  if (response.status !== 401) {
    return response
  }

  const refreshedToken = await refreshAccessToken()
  const retryHeaders = new Headers(options.headers ?? {})
  retryHeaders.set('Authorization', `Bearer ${refreshedToken}`)

  response = await fetch(url, {
    ...options,
    headers: retryHeaders,
  })

  return response
}
