import axios from "axios";

// In dev: Vite proxies /api → localhost:8000
// In prod: VITE_API_URL = https://your-railway-app.up.railway.app
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const getStats        = ()       => api.get("/stats/");
export const getOrgs         = (params) => api.get("/orgs/", { params });
export const getOrg          = (id)     => api.get(`/orgs/${id}/`);
export const getContacts     = (params) => api.get("/contacts/", { params });
export const getContact      = (id)     => api.get(`/contacts/${id}/`);
export const getPipelineRuns = ()       => api.get("/pipeline/");
export const getPipelineStatus = ()     => api.get("/pipeline/status/");
export const triggerPipeline = (stage)  => api.post("/pipeline/trigger/", { stage });
export const exportCsv       = ()       =>
  `${BASE_URL}/export/`;

export default api;
