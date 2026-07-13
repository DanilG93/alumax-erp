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
