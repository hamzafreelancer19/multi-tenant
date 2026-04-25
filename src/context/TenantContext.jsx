import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState({
    hostname: window.location.hostname,
    schoolId: null,
    schoolName: null,
    landing: null,
    loading: true,
    error: null,
  });

  const fetchTenantInfo = useCallback(async () => {
    setTenant(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.get('/tenant-info/');
      if (response.data.school_id) {
        setTenant(prev => ({
          ...prev,
          schoolId: response.data.school_id,
          schoolName: response.data.school_name,
          landing: response.data.landing,
          loading: false,
        }));
      } else {
        setTenant(prev => ({
          ...prev,
          loading: false,
          schoolName: null,
          landing: null,
        }));
      }
    } catch (err) {
      setTenant(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.detail || 'Tenant not found',
      }));
    }
  }, []);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  return (
    <TenantContext.Provider value={{ ...tenant, refreshTenant: fetchTenantInfo }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
