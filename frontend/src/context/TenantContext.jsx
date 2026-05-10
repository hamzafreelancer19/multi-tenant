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

  const setForcedSchool = useCallback(async (slug) => {
    if (!slug) return;
    setTenant(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.get(`/tenant-info/?domain=${slug}`);
      if (response.data.school_id) {
        setTenant(prev => ({
          ...prev,
          schoolId: response.data.school_id,
          schoolName: response.data.school_name,
          landing: response.data.landing,
          loading: false,
        }));
      }
    } catch (err) {
      setTenant(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchTenantInfo();
  }, [fetchTenantInfo]);

  // Apply Branding Colors to CSS Variables
  useEffect(() => {
    if (tenant.branding) {
      const root = document.documentElement;
      
      // Dashboard Colors
      if (tenant.branding.dashboard) {
        root.style.setProperty('--dashboard-primary', tenant.branding.dashboard.primary_color);
        root.style.setProperty('--dashboard-secondary', tenant.branding.dashboard.secondary_color);
        root.style.setProperty('--dashboard-accent', tenant.branding.dashboard.accent_color);
      }
      
      // Landing Colors
      if (tenant.branding.landing) {
        root.style.setProperty('--landing-primary', tenant.branding.landing.primary_color);
        root.style.setProperty('--landing-secondary', tenant.branding.landing.secondary_color);
      }
    }
  }, [tenant.branding]);

  return (
    <TenantContext.Provider value={{ ...tenant, refreshTenant: fetchTenantInfo, setForcedSchool }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
