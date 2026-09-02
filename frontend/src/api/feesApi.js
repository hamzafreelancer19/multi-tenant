import api from "./axios";

// Get all fee records (optional ?status=Paid|Pending filter)
export const getFees = (params = {}) => api.get("fees/", { params });

// Record a new fee payment
export const createFee = (data) => api.post("fees/", data);

export const updateFee = (id, data) => api.patch(`fees/${id}/`, data);

// Delete a fee record
export const deleteFee = (id) => api.delete(`fees/${id}/`);

// Get fee statistics
export const getFeeStats = () => api.get("fees/stats/");
