import React, { createContext, useContext, useState, useEffect } from 'react';
import autoBlogAPI from '../services/api';
import { getStoredInviteCode, getStoredReferralCode, clearStoredReferralInfo } from '../utils/referralUtils';

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
      if (token) {
        const response = await autoBlogAPI.me();
        
        // Debug logging to verify user data from API
        console.log('🔍 AuthContext received user data from /me:', {
          userId: response.user?.id,
          email: response.user?.email,
          role: response.user?.role,
          permissions: response.user?.permissions,
          hierarchyLevel: response.user?.hierarchyLevel,
          fullUserObject: response.user
        });
        
        setUser(response.user);
        // Handle new database structure with organization data
        if (response.user.organizationId) {
          setCurrentOrganization({
            id: response.user.organizationId,
            name: response.user.organizationName,
            role: response.user.organizationRole
          });
        }
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
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
      
      // Process referral/invite after successful registration
      const inviteCode = getStoredInviteCode();
      const referralCode = getStoredReferralCode();
      const codeToProcess = inviteCode || referralCode;
      
      console.log('🔄 Registration complete, checking for referral processing:', {
        userId: response.user.id,
        userEmail: response.user.email,
        inviteCode,
        referralCode,
        codeToProcess,
        sessionStorageInvite: sessionStorage.getItem('inviteCode'),
        sessionStorageReferral: sessionStorage.getItem('referralCode')
      });
      
      if (codeToProcess) {
        try {
          console.log('🎯 Processing referral signup for code:', codeToProcess, 'type:', inviteCode ? 'invite' : 'referral');
          const referralResult = await autoBlogAPI.processReferralSignup(response.user.id, codeToProcess);
          console.log('Referral processing result:', referralResult);
          
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
        console.log('Restoring admin session from API response');
        
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