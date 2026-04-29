import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { setToken, setRefreshToken, setUser } from '../../store/authStore';
import { getUserProfile } from '../../auth/authService';

const TokenHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');

    if (token) {
      const handleHandoff = async () => {
        console.log("Token handoff detected, saving token...");
        setToken(token);
        if (refresh) {
          setRefreshToken(refresh);
        }
        
        try {
          // Fetch user profile on the NEW domain to ensure localStorage is fully populated
          const profile = await getUserProfile();
          setUser(profile);
          console.log("Profile synchronized on new domain.");
        } catch (err) {
          console.error("Failed to sync profile during handoff:", err);
        }

        // Clean the URL and redirect to dashboard
        navigate('/dashboard', { replace: true });
      };

      handleHandoff();
    }
  }, [searchParams, navigate]);

  return null;
};

export default TokenHandler;
