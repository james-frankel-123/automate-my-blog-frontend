import React, { createContext, useContext, useState, useEffect } from 'react';
import autoBlogAPI from '../services/api';
import { getStoredInviteCode, getStoredReferralCode, clearStoredReferralInfo } from '../utils/referralUtils';

// Module-level cache for deduplicating auth requests
const activeAuthRequests = new Map();

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loginContext, setLoginContext] = useState(null); // 'gate' or 'nav'
  const [impersonationData, setImpersonationData] = useState(null); // stores original admin info
  const [isNewRegistration, setIsNewRegistration] = useState(false); // tracks if user just registered

  // ROLE-BASED PERMISSIONS: Check user permissions from database
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
  const isSuperAdmin = user && user.role === 'super_admin';
  const userPermissions = user?.permissions || [];
  
  // Permission checker utility
  const hasPermission = (permission) => {
    return userPermissions.includes(permission);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Smart API deduplication - check for in-flight request
      const requestKey = 'auth_check';
      if (activeAuthRequests.has(requestKey)) {
        const response = await activeAuthRequests.get(requestKey);
        setUser(response.user);
        if (response.user?.organizationId) {
          setCurrentOrganization({
            id: response.user.organizationId,
            name: response.user.organizationName,
            role: response.user.organizationRole
          });
        }
        setLoading(false);
        return;
      }

      // Check session cache (5 minute TTL for security)
      const cacheKey = 'auth_user_cache';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          if (timestamp > fiveMinutesAgo) {
            setUser(data.user);
            if (data.user?.organizationId) {
              setCurrentOrganization({
                id: data.user.organizationId,
                name: data.user.organizationName,
                role: data.user.organizationRole
              });
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          // Invalid cache, continue with API call
          sessionStorage.removeItem(cacheKey);
        }
      }

      // Make API request with deduplication
      const apiPromise = autoBlogAPI.me();
      activeAuthRequests.set(requestKey, apiPromise);

      try {
        const response = await apiPromise;
        
        // Cache the response
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response,
          timestamp: Date.now()
        }));
        
        setUser(response.user);
        // Handle new database structure with organization data
        if (response.user.organizationId) {
          setCurrentOrganization({
            id: response.user.organizationId,
            name: response.user.organizationName,
            role: response.user.organizationRole
          });
        }
      } finally {
        activeAuthRequests.delete(requestKey);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('auth_user_cache');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, context = null) => {
    const response = await autoBlogAPI.login(email, password);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    setUser(response.user);
    // Handle new database structure with organization data
    if (response.user.organizationId) {
      setCurrentOrganization({
        id: response.user.organizationId,
        name: response.user.organizationName,
        role: response.user.organizationRole
      });
    }
    
    // Store login context for routing decisions
    setLoginContext(context);
    setIsNewRegistration(false); // Mark as login, not registration
    
    return { ...response, context };
  };

  const register = async (userData, context = null) => {
    const response = await autoBlogAPI.register(userData);
    
    // If registration includes auto-login, handle context
    if (response.user) {
      setUser(response.user);
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      setLoginContext(context);
      setIsNewRegistration(true); // Mark as new registration
      
      // Process referral/invite after successful registration
      const inviteCode = getStoredInviteCode();
      const referralCode = getStoredReferralCode();
      const codeToProcess = inviteCode || referralCode;
      
      if (codeToProcess) {
        try {
          const referralResult = await autoBlogAPI.processReferralSignup(response.user.id, codeToProcess);
          
          // Clear stored codes after successful processing
          clearStoredReferralInfo();
          
          // Show success message based on referral type
          if (referralResult?.type === 'referral') {
            // Will be handled by the RegisterModal component
            return { 
              ...response, 
              context, 
              referralProcessed: true, 
              referralType: 'customer',
              rewardValue: referralResult.rewardValue 
            };
          } else if (referralResult?.type === 'organization_member') {
            return { 
              ...response, 
              context, 
              referralProcessed: true, 
              referralType: 'organization' 
            };
          }
        } catch (error) {
          console.error('Failed to process referral signup:', error);
          // Don't fail registration if referral processing fails
        }
      }
    }
    
    return { ...response, context };
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setCurrentOrganization(null);
    setLoginContext(null);
    setIsNewRegistration(false); // Clear registration flag on logout
  };

  const clearLoginContext = () => {
    setLoginContext(null);
  };

  const setNavContext = () => {
    setLoginContext('nav');
  };

  // Impersonation functionality
  const startImpersonation = async (impersonationToken, targetUser) => {
    try {
      // Store the current user as the original admin
      const originalAdmin = { ...user };
      setImpersonationData({
        originalAdmin,
        originalToken: localStorage.getItem('accessToken')
      });

      // Replace the token and update the user
      localStorage.setItem('accessToken', impersonationToken);
      
      // Create the impersonated user object
      const impersonatedUser = {
        ...targetUser,
        isImpersonating: true,
        originalAdmin
      };
      
      setUser(impersonatedUser);
      
      // Handle organization for impersonated user
      if (targetUser.organizationId) {
        setCurrentOrganization({
          id: targetUser.organizationId,
          name: targetUser.organizationName,
          role: targetUser.organizationRole
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to start impersonation:', error);
      return { success: false, error: error.message };
    }
  };

  const endImpersonation = async () => {
    try {
      // Check if currently impersonating (either from state or JWT token)
      const isImpersonatingFromToken = user?.isImpersonating || user?.originalAdmin;
      
      if (!impersonationData && !isImpersonatingFromToken) {
        throw new Error('Not currently impersonating');
      }

      // Call the API to end impersonation
      const response = await autoBlogAPI.endImpersonation();
      
      // If we have impersonation data, restore from it
      if (impersonationData) {
        // Restore the original admin user and token
        localStorage.setItem('accessToken', impersonationData.originalToken);
        setUser(impersonationData.originalAdmin);
        
        // Restore original organization
        if (impersonationData.originalAdmin.organizationId) {
          setCurrentOrganization({
            id: impersonationData.originalAdmin.organizationId,
            name: impersonationData.originalAdmin.organizationName,
            role: impersonationData.originalAdmin.organizationRole
          });
        } else {
          setCurrentOrganization(null);
        }
      } else if (response.originalAdmin) {
        // Fallback: restore from API response
        
        // Clear current token and get fresh session for original admin
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Force a fresh auth check to get the original admin's session
        setUser(null);
        setCurrentOrganization(null);
        
        // Trigger auth check which should restore the admin session
        checkAuthStatus();
      }

      // Clear impersonation data
      setImpersonationData(null);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to end impersonation:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    currentOrganization,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    hasPermission,
    userPermissions,
    loginContext,
    clearLoginContext,
    setNavContext,
    // Registration tracking
    isNewRegistration,
    clearNewRegistration: () => setIsNewRegistration(false),
    // Impersonation functionality
    isImpersonating: !!impersonationData,
    impersonationData,
    startImpersonation,
    endImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};