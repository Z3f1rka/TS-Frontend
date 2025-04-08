import axios from 'axios'

const api_photo = axios.create({
  baseURL: import.meta.env.VITE_FILES_API_URL,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
  },
})

api_photo.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    // if (error.response) {
    //   const errorCode = error.response.status
    //   const errorMessage = error.response.data.message || 'Unknown error'
    //   console.error('Error details:')
    //   console.error(error)
    //   console.error('Error code:', errorCode)
    //   console.error('Error message:', errorMessage)
    //   console.error('Error detail', error.response.data.detail)
    // }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (
        error.response.data.detail === 'Токен недействителен или просрочен' ||
        error.response.data.detail === 'Token is invalid or expired'
      ) {
        localStorage.clear()
        window.location.href = '/login'
      } else {
        originalRequest._retry = true

        const refresh = localStorage.getItem('refresh_token')

        try {
          const response = await api_photo.post('auth/refresh', {
            headers: { 'jwt-refresh': refresh },
          })
          const newAccessToken = response.data.access

          localStorage.setItem('token', newAccessToken)
          originalRequest.headers['authorization'] = `Bearer ${newAccessToken}`

          return api_photo(originalRequest)
        } catch (refreshError) {}
      }
    }
  },
)

api_photo.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers['authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)
export default api_photo
