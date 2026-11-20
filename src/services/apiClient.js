/**
 * Cliente HTTP Centralizado con Inyección de Bearer Token (JWT)
 * Cumple con los estándares de seguridad de Azure Entra ID y manejo de estados HTTP (401, 403, 429, 500).
 */

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('pedidos360_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken || null;
  } catch {
    return null;
  }
};

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Función fetch resiliente con inyección automática de cabeceras de autorización
 */
export const apiClient = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Inyectar JWT Bearer si el usuario está autenticado
  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // 1. Manejo específico de Bloqueo Antifraude por Velocidad (HTTP 429)
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.mensaje || 'Bloqueo preventivo por regla de velocidad antifraude (>3 intentos en 10s).',
        429,
        errorData
      );
    }

    // 2. Manejo de autenticación inválida o vencida (HTTP 401 / 403)
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        'Acceso no autorizado o token vencido. Por favor inicia sesión nuevamente.',
        response.status,
        errorData
      );
    }

    // 3. Manejo de errores de servidor o validación
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || errorData.mensaje || `Error en servidor (HTTP ${response.status})`;
      throw new ApiError(message, response.status, errorData);
    }

    // Respuesta exitosa
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Errores de red o DNS caído
    throw new ApiError(
      `Fallo de conexión de red con el endpoint: ${error.message}`,
      0,
      { originalError: error.message }
    );
  }
};

export default apiClient;
