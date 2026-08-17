import axios from"axios"
export const apiClient = axios.create({
baseURL: "http://localhost:8000/v1/api",
});

// apiClient.interceptors.request.use((config)=>{
//     const token = localStorage.getItem("");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// })