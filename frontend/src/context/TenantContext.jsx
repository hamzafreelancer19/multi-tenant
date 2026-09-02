import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const TenantContext = createContext();

const isPlatformHost = (hostname) => {
  const host = (hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState({
    hostname: window.location.hostname,
    schoolId: null,
    schoolName: null,
    schoolDomain: null,
    schoolSlug: null,
    landing: null,
    branding: null,
    loading: true,
    error: null,
  });

  const applyTenant = useCallback((data) => {
    if (data?.school_id) {
      setTenant((prev) => ({
        ...prev,
        schoolId: data.school_id,
        schoolName: data.school_name,
        schoolDomain: data.school_domain || null,
        schoolSlug: data.school_slug || null,
        landing: data.landing,
        branding: data.branding,
        loading: false,
        error: null,
      }));
    } else {
      setTenant((prev) => ({
        ...prev,
        schoolId: null,
        schoolName: null,
        schoolDomain: null,
        schoolSlug: null,
        landing: null,
        branding: null,
        loading: false,
        error: data?.detail || null,
      }));
    }
  }, []);

  const fetchTenantInfo = useCallback(async () => {
    setTenant((prev) => ({ ...prev, loading: true }));
    try {
      const hostname = window.location.hostname;
      const params = isPlatformHost(hostname) ? {} : { domain: hostname };
      const response = await api.get('/tenant-info/', { params });
      applyTenant(response.data);
    } catch (err) {
      setTenant((prev) => ({
        ...prev,
        loading: false,
        schoolName: null,
        error: err.response?.data?.detail || 'Tenant not found',
      }));
    }
  }, [applyTenant]);

  const setForcedSchool = useCallback(async (slug) => {
    if (!slug) return;
    setTenant((prev) => ({ ...prev, loading: true }));
    try {
      const response = await api.get('/tenant-info/', { params: { domain: slug } });
      applyTenant(response.data);
    } catch (err) {
      setTenant((prev) => ({ ...prev, loading: false }));
    }
  }, [applyTenant]);

  useEffect(() => {
    const slugMatch = window.location.pathname.match(/^\/s\/([^/]+)/);
    if (slugMatch) {
      setForcedSchool(decodeURIComponent(slugMatch[1]));
    } else {
      fetchTenantInfo();
    }
  }, [fetchTenantInfo, setForcedSchool]);

  useEffect(() => {
    const root = document.documentElement;
    ["--dashboard-primary", "--dashboard-secondary", "--dashboard-accent", "--landing-primary", "--landing-secondary"].forEach((prop) => {
      root.style.removeProperty(prop);
    });
  }, []);

  return (
    <TenantContext.Provider value={{ ...tenant, refreshTenant: fetchTenantInfo, setForcedSchool }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
