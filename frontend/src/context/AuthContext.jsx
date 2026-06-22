import { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
// We assume auth.api.js exports getMeAPI, loginAPI, and logoutAPI
import { getMeAPI, loginAPI, logoutAPI } from '../api/auth.api';
import { useQueryClient } from '@tanstack/react-query';
// 1. Initial State Definition
const initialState = {
  isAuthenticated: false,
  user: null,        // { id, name, email, role }
  profile: null,     // Student/Teacher specific profile details
  completion: null,  // Profile completion percentage/status
  accessToken: null, // Strictly in-memory string
  isLoading: true,   // Starts true to show loading spinners during initial mount rehydration
};

// 2. Reducer Action Types
const AuthActionTypes = {
  INITIALIZE: 'INITIALIZE',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_TOKEN: 'UPDATE_TOKEN',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
};

// 3. Reducer Function
function authReducer(state, action) {
  switch (action.type) {
    case AuthActionTypes.INITIALIZE:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user || null,
        profile: action.payload.profile || null,
        completion: action.payload.completion || null,
        // Preserve existing access token in memory if rehydrating smoothly
        accessToken: action.payload.accessToken || state.accessToken,
        isLoading: false,
      };

    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
      };

    case AuthActionTypes.UPDATE_TOKEN:
      return {
        ...state,
        accessToken: action.payload.accessToken,
      };

    case AuthActionTypes.UPDATE_PROFILE:
      return {
        ...state,
        profile: action.payload.profile,
        completion: action.payload.completion,
      };

    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false, // Ensure loading is false after logging out
      };

    default:
      return state;
  }
}

// 4. Context Creation
export const AuthContext = createContext(null);

// 5. Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const queryClient = useQueryClient();

  // --- Session Rehydration Flow ---
  const initializeSession = useCallback(async () => {
    try {
      // Calls GET /api/v1/users/me
      // If token is missing/expired, your Axios interceptor handles the silent refresh automatically
      const response = await getMeAPI();
      const { user, profile, completion } = response.data.data;

      dispatch({
        type: AuthActionTypes.INITIALIZE,
        payload: {
          isAuthenticated: true,
          user,
          profile,
          completion,
        },
      });
    } catch (error) {
      console.error("Session rehydration failed:", error?.response?.data?.message || error.message);
      // Cleanly end the loading state as unauthenticated
      dispatch({
        type: AuthActionTypes.INITIALIZE,
        payload: {
          isAuthenticated: false,
          user: null,
          profile: null,
          completion: null,
          accessToken: null,
        },
      });
    }
  }, []);

  // Run initial check on app load
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // --- Context Actions ---

  /**
   * Execute login against the backend and update in-memory state
   */
  const login = useCallback(async (credentials) => {
    const response = await loginAPI(credentials);
    const { user, accessToken } = response.data.data;

    dispatch({
      type: AuthActionTypes.LOGIN_SUCCESS,
      payload: { user, accessToken },
    });

    // Optionally fetch full profile status right after logging in
    // if the login payload doesn't return nested profile objects directly
    if (user.role === 'student') {
      initializeSession();
    }

    return response.data;
  }, [initializeSession]);

  /**
   * Execute logout API call to clear backend HttpOnly cookies, then clear memory
   */
  const logout = useCallback(async () => {
    try {
      await logoutAPI();
    } catch (error) {
      console.error("Logout API call encountered an error:", error);
    } finally {
      dispatch({ type: AuthActionTypes.LOGOUT });
      queryClient.clear();
    }
  }, [queryClient]);

  /**
   * Allow Axios interceptors to silently inject a freshly rotated access token into Context memory
   */
  const setAccessToken = useCallback((newAccessToken) => {
    dispatch({
      type: AuthActionTypes.UPDATE_TOKEN,
      payload: { accessToken: newAccessToken },
    });
  }, []);

  /**
   * Manually update profile completion state in context after saving a profile edit form
   */
  const updateProfileState = useCallback((updatedProfile, completionStatus) => {
    dispatch({
      type: AuthActionTypes.UPDATE_PROFILE,
      payload: { profile: updatedProfile, completion: completionStatus },
    });
  }, []);

  // Memoize context values to prevent unnecessary consumer re-renders
  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout,
    setAccessToken,
    updateProfileState,
    refetchSession: initializeSession,
  }), [state, login, logout, setAccessToken, updateProfileState, initializeSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};