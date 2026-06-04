import { useCallback, useEffect, useState } from 'react';
import { getTeacherProfileAPI, updateTeacherProfileAPI } from '../api/user.api';
import { useAuth } from './useAuth';

function useProfile() {
  const { refetchSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTeacherProfileAPI();
      const payload = response?.data?.data ?? response?.data ?? null;
      setProfile(payload);
      return payload;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load teacher profile.';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile().catch(() => undefined);
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (payload) => {
      setIsSaving(true);
      setError('');

      try {
        const response = await updateTeacherProfileAPI(payload);
        const updatedProfile = response?.data?.data ?? response?.data ?? null;
        setProfile((current) => ({ ...(current || {}), ...(updatedProfile || {}) }));

        if (typeof refetchSession === 'function') {
          await refetchSession();
        }

        return updatedProfile;
      } catch (err) {
        const message = err?.response?.data?.message || 'Failed to update teacher profile.';
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [refetchSession]
  );

  return {
    profile,
    isLoading,
    isSaving,
    error,
    setError,
    refreshProfile: loadProfile,
    updateProfile,
  };
}

export default useProfile;