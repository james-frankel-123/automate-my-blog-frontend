import React, { createContext, useContext, useState, useEffect } from 'react';
import autoBlogAPI from '../services/api';
import { getStoredInviteCode, getStoredReferralCode, clearStoredReferralInfo } from '../utils/referralUtils';

// Module-level cache for deduplicating auth requests
const activeAuthRequests = new Map();

const AuthContext = createContext();

// Duration to keep "logged in" UI during logout so animation can complete (fixes #186)
const LOGOUT_ANIMATION_MS = 500;

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
  const [isLoggingOut, setIsLoggingOut] = useState(false); // true while logout animation runs (fixes #186)

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

    // Retry auth check if it failed due to network issues
    // This helps recover from temporary connection problems after Stripe redirect
    const retryAuthCheck = setTimeout(() => {
      const hasToken = localStorage.getItem('accessToken');
      if (hasToken && !user && !loading) {
        console.log('🔄 Retrying auth check after initial failure');
        checkAuthStatus();
      }
    }, 3000); // Retry after 3 seconds if still not authenticated

    // Safety: never leave app stuck on loading (e.g. getCurrentUser hangs or race)
    const AUTH_LOADING_MAX_MS = 65000; // slightly above makeRequest 60s timeout
    const loadingSafety = setTimeout(() => {
      setLoading((prev) => (prev ? false : prev));
    }, AUTH_LOADING_MAX_MS);

    return () => {
      clearTimeout(retryAuthCheck);
      clearTimeout(loadingSafety);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Make API request with deduplication - use new auth endpoint
      const apiPromise = autoBlogAPI.getCurrentUser();
      activeAuthRequests.set(requestKey, apiPromise);

      try {
        const response = await apiPromise;
        
        // Cache the response
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response,
          timestamp: Date.now()
        }));
        
        setUser(response.user);
        // Handle organization data from Phase 1A auth system
        if (response.user?.organization) {
          setCurrentOrganization(response.user.organization);
        } else if (response.user?.organizationId) {
          // Fallback for legacy structure
          setCurrentOrganization({
            id: response.user.organizationId,
            name: response.user.organizationName,
            role: response.user.organizationRole || 'owner'
          });
        }
      } finally {
        activeAuthRequests.delete(requestKey);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', {
        error: error.message,
        errorType: error.constructor.name,
        hasToken: !!localStorage.getItem('accessToken')
      });

      // Only clear tokens if authentication is explicitly invalid (401/403)
      // Don't clear on network errors, timeouts, or other temporary issues
      const isAuthError = error.message?.includes('401') ||
                         error.message?.includes('403') ||
                         error.message?.includes('Unauthorized') ||
                         error.message?.includes('Invalid token');

      if (isAuthError) {
        console.log('🔑 Invalid auth token - clearing stored credentials');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('auth_user_cache');
      } else {
        console.log('⚠️ Auth check failed but keeping tokens for retry (likely network issue)');
        // Keep tokens for potential retry - user can still be logged in
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, context = null) => {
    const response = await autoBlogAPI.login(email, password);
    // Tokens are now handled in the API service
    setUser(response.user);
    
    // Track login completion
    try {
      if (autoBlogAPI && typeof autoBlogAPI.trackEvent === 'function') {
        autoBlogAPI.trackEvent({
          eventType: 'login_completed',
          eventData: { 
            userId: response.user?.id,
            email: response.user?.email,
            context 
          },
          userId: response.user?.id,
          pageUrl: window.location.href
        }).catch(err => console.error('Failed to track login:', err));
      }
    } catch (error) {
      // Analytics failure shouldn't break login
      console.error('Failed to track login:', error);
    }
    // Handle organization data from Phase 1A auth system
    if (response.user?.organization) {
      setCurrentOrganization(response.user.organization);
    } else if (response.user?.organizationId) {
      // Fallback for legacy structure
      setCurrentOrganization({
        id: response.user.organizationId,
        name: response.user.organizationName,
        role: response.user.organizationRole || 'owner'
      });
    }
    
    // Store login context for routing decisions
    setLoginContext(context);
    setIsNewRegistration(false); // Mark as login, not registration
    
    // Trigger session adoption to transfer anonymous data to user account
    try {
      const sessionId = sessionStorage.getItem('audience_session_id');
      if (sessionId) {
        console.log('🔄 Triggering session adoption after login...');
        
        // Adopt audiences session
        const adoptionResult = await autoBlogAPI.adoptSession(sessionId);
        console.log('✅ Audience session adoption complete:', adoptionResult);
        
        // Adopt posts session
        const postsAdoptionResult = await autoBlogAPI.adoptPostsSession(sessionId);
        console.log('✅ Posts session adoption complete:', postsAdoptionResult);
        
        // Adopt website analysis session
        const analysisAdoptionResult = await autoBlogAPI.adoptAnalysisSession(sessionId);
        console.log('✅ Analysis session adoption complete:', analysisAdoptionResult);
        
        // Clear session ID after successful adoption
        sessionStorage.removeItem('audience_session_id');
      }
    } catch (error) {
      console.error('⚠️ Session adoption failed (non-critical):', error.message);
      // Don't fail login if adoption fails
    }
    
    return { ...response, context };
  };

  const register = async (userData, context = null) => {
    const response = await autoBlogAPI.register(userData);
    
    // Registration now includes auto-login with organization setup
    if (response.user) {
      setUser(response.user);
      // Handle organization data from Phase 1A registration
      if (response.user?.organization) {
        setCurrentOrganization(response.user.organization);
      } else if (response.organization) {
        setCurrentOrganization(response.organization);
      }
      
      setLoginContext(context);
      setIsNewRegistration(true); // Mark as new registration

      // Track registration conversion
      autoBlogAPI.trackLeadConversion('registration', {
        user_id: response.user.id,
        email: response.user.email,
        has_organization: !!(response.user?.organization || response.organization),
        registration_context: context,
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Failed to track registration:', err));
      
      // Track signup completion analytics event
      try {
        if (autoBlogAPI && typeof autoBlogAPI.trackEvent === 'function') {
          autoBlogAPI.trackEvent({
            eventType: 'signup_completed',
            eventData: {
              userId: response.user.id,
              email: response.user.email,
              has_organization: !!(response.user?.organization || response.organization),
              context
            },
            userId: response.user.id,
            pageUrl: window.location.href
          }).catch(err => console.error('Failed to track signup completion:', err));
        }
      } catch (error) {
        // Analytics failure shouldn't break registration
        console.error('Failed to track signup completion:', error);
      }

      // Trigger session adoption to transfer anonymous data to user account
      try {
        const sessionId = sessionStorage.getItem('audience_session_id');
        if (sessionId) {
          console.log('🔄 Triggering session adoption after registration...');
          
          // Adopt audiences session
          const adoptionResult = await autoBlogAPI.adoptSession(sessionId);
          console.log('✅ Audience session adoption complete:', adoptionResult);
          
          // Adopt posts session
          const postsAdoptionResult = await autoBlogAPI.adoptPostsSession(sessionId);
          console.log('✅ Posts session adoption complete:', postsAdoptionResult);
          
          // Adopt website analysis session
          const analysisAdoptionResult = await autoBlogAPI.adoptAnalysisSession(sessionId);
          console.log('✅ Analysis session adoption complete:', analysisAdoptionResult);
          
          // Clear session ID after successful adoption
          sessionStorage.removeItem('audience_session_id');
        }
      } catch (error) {
        console.error('⚠️ Session adoption failed (non-critical):', error.message);
        // Don't fail registration if adoption fails
      }
      
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

  const logout = async () => {
    // Prevent logged-out UI (e.g. website search) from flashing before animation completes (fixes #186)
    setIsLoggingOut(true);

    try {
      // Use new API logout method (handles token cleanup)
      await autoBlogAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local cleanup even if server call fails
    }

    // SECURITY: Always clear workflow state so no user/anonymous data persists (fixes #182)
    localStorage.removeItem('automate-my-blog-workflow-state');

    // Clear all user-specific localStorage data (preserve theme preference)
    const theme = localStorage.getItem('theme');
    const keysToRemove = [];

    // Find all user-specific keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Keep theme, remove everything else
      if (key && key !== 'theme') {
        keysToRemove.push(key);
      }
    }

    // Remove all user-specific keys
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Restore theme if it existed
    if (theme) {
      localStorage.setItem('theme', theme);
    }

    // Clear all sessionStorage (no need to preserve anything)
    sessionStorage.clear();

    // Delay clearing user state until after logout animation so no UI flash (fixes #186)
    setTimeout(() => {
      setUser(null);
      setCurrentOrganization(null);
      setLoginContext(null);
      setIsNewRegistration(false);
      setIsLoggingOut(false);
    }, LOGOUT_ANIMATION_MS);
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
    // Logout animation (fixes #186)
    isLoggingOut,
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