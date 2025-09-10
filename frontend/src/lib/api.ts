import axios from "axios";

// Axios instance that points to our backend API. Historically the project used
// two different environment variable names (`VITE_API_URL` and
// `VITE_API_BASE_URL`).  When the latter wasn't defined the axios instance would
// silently fall back to `http://localhost:8088`, which meant API calls such as
// fetching notifications hit the wrong host and returned nothing.  To make the
// client resilient we now check both variables and only then fall back to the
// localhost default.
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8088",
});

export default api;
