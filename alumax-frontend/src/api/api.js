import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getWorkOrders = () => api.get("/work-orders");
export const updateWorkOrderStatus = (id, status) =>
  api.put(`/work-orders/${id}/status?status=${status}`);
export const getTemplates = () => api.get("/templates");
export const createTemplate = (template) => api.post("/templates", template);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);
export const createWorkOrder = (workOrder) =>
  api.post("/work-orders", workOrder);

export const getCustomerSuggestions = () =>
  api.get("/work-orders/customers/suggestions");

export const getAllOrderItems = () => {
  return api.get("/work-orders/items");
};

export const updateOrderItemStatus = (itemId, newStatus) => {
  return api.put(`/work-orders/items/${itemId}/status?status=${newStatus}`);
};

export const updateTemplate = (id, data) =>
  axios.put(`${API_BASE_URL}/templates/${id}`, data);

// Katalog Servisa
export const getServiceActions = () => api.get("/service-actions");
export const createServiceAction = (action) =>
  api.post("/service-actions", action);
export const deleteServiceAction = (id) => api.delete(`/service-actions/${id}`);

// Upravljanje pojedinačnim stavkama (Komarnicima)
export const toggleItemUrgency = (itemId) =>
  api.patch(`/order-items/${itemId}/toggle-urgent`);

// Upravljanje Korisnicima
export const loginUser = (credentials) => api.post("/users/login", credentials);
export const getUsers = () => api.get("/users");
export const createUser = (user) => api.post("/users", user);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const changePassword = (id, newPassword) =>
  api.put(`/users/${id}/password`, newPassword, {
    headers: { "Content-Type": "text/plain" },
  });

// Izračunavanje krojne liste
export const getItemCalculations = (itemId) =>
  api.get(`/work-orders/items/${itemId}/calculations`);
