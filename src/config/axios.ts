import axios from "axios";
import OfflineSync from '@/utils/offlineSync';

const axiosInstance = axios.create({
  baseURL: "https://web-production-6342.up.railway.app/api",
  timeout: 10000,
});

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // Si no hay conexión a internet
    if (!navigator.onLine) {
      // Si es una petición POST, PUT o DELETE, guardarla para sincronizar después
      if (['post', 'put', 'delete'].includes(error.config.method)) {
        await OfflineSync.saveForLater({
          url: error.config.url,
          method: error.config.method,
          data: error.config.data,
          timestamp: Date.now()
        });
        return Promise.resolve({ data: { offline: true, type: 'no_internet' } });
      }
      return Promise.reject({
        ...error,
        offline: true,
        type: 'no_internet',
        message: 'Sin conexión a internet'
      });
    }
    // Si hay conexión pero el servidor no responde
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        ...error,
        offline: true,
        type: 'timeout',
        message: 'Tiempo de espera agotado'
      });
    }
    // Si la conexión fue rechazada
    if (error.code === 'ERR_CONNECTION_REFUSED') {
      return Promise.reject({
        ...error,
        offline: true,
        type: 'connection_refused',
        message: 'Conexión rechazada'
      });
    }
    // Si no hay respuesta del servidor
    if (!error.response) {
      return Promise.reject({
        ...error,
        offline: true,
        type: 'server_down',
        message: 'Servidor no disponible'
      });
    }
    return Promise.reject(error);
  }
);

// Agregar listener para conexión online
window.addEventListener('online', () => {
  OfflineSync.syncPendingRequests();
});

export default axiosInstance;
