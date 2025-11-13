const DEFAULT_API_BASE_URL = "http://localhost:5050/api";
const RAW_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL;
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

const buildApiUrl = (path = "") => {
  const normalizedPath = path.toString().replace(/^\/+/, "");
  if (!normalizedPath) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}/${normalizedPath}`;
};

export { API_BASE_URL, buildApiUrl };
