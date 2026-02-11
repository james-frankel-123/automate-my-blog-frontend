/**
 * AdminLinkBar - Shown at the top of the page for superusers only.
 * Renders a button link to the backend admin panel login ({backendUrl}/admin/login).
 */
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const backendUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
const adminLoginUrl = `${backendUrl}/admin/login`;

const AdminLinkBar = () => {
  const { loading, isSuperAdmin, user } = useAuth();
  const isSuperUser = isSuperAdmin || user?.is_superuser === true;

  if (loading || !isSuperUser) {
    return null;
  }

  return (
    <div
      role="banner"
      aria-label="Admin link"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        background: 'var(--color-primary, #6366F1)',
        color: '#fff',
        fontSize: 'var(--font-size-sm, 14px)',
        fontWeight: 500,
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <a
        href={adminLoginUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#fff',
          textDecoration: 'none',
          padding: '4px 12px',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.2)',
          transition: 'background 0.15s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        }}
      >
        Admin
      </a>
    </div>
  );
};

export default AdminLinkBar;
