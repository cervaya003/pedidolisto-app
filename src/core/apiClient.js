export const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) console.error("Falta VITE_API_URL en el archivo .env del frontend.");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token, cache, file } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (file) headers["Content-Type"] = file.type;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      cache,
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.details?.[0];
    throw new ApiError(detail ? `${data.error}: ${detail}` : (data?.error ?? `Error ${response.status}`), response.status);
  }
  return data;
}

export const apiClient = {
  get: (path, options) => request(path, options),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  /** Envía un archivo (Blob) tal cual, con su tipo como Content-Type. */
  upload: (path, file, options) => request(path, { ...options, method: "POST", file }),
};
