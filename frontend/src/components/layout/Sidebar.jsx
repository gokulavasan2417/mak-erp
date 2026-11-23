import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Briefcase,
  Car,
  Truck,
  Calculator,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../context/TenantContext';
import { EditProfileModal } from '../common/EditProfileModal';

export function Sidebar({
  portal = 'admin',
  navItems = [],
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { logout, currentUser } = useAuth();
  const { currentCompany } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.avatar]);

  // Auto-close mobile sidebar drawer on navigation change
  useEffect(() => {
    if (isMobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [location.pathname]);
  // Track expanded submenus
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Auto-expand any submenu whose child is the active route
  useEffect(() => {
    navItems.forEach((item, idx) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          child.end
            ? location.pathname === child.to
            : location.pathname === child.to || location.pathname.startsWith(child.to + '/')
        );
        if (isChildActive) {
          setOpenSubmenus((prev) => ({ ...prev, [item.label || idx]: true }));
        }
      }
    });
  }, [location.pathname, navItems]);

  const toggleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getPortalInfo = () => {
    switch (portal) {
      case 'super-admin':
        return {
          title: 'Super Admin',
          badge: 'GOVERNANCE',
          icon: Shield,
          color: '#C7CEFA'
        };
      case 'driver':
        return {
          title: 'Driver Portal',
          badge: 'DRIVER',
          icon: Car,
          color: '#10b981'
        };
      case 'vendor':
        return {
          title: 'Vendor Partner',
          badge: 'SUPPLIER',
          icon: Truck,
          color: '#f59e0b'
        };
      case 'staff':
        return {
          title: 'Staff Personnel',
          badge: 'EMPLOYEE',
          icon: Briefcase,
          color: '#38bdf8'
        };
      case 'accountant':
        return {
          title: 'Accountant Portal',
          badge: 'FINANCE & ACCOUNTS',
          icon: Calculator,
          color: '#10b981'
        };
      case 'admin':
      default:
        return {
          title: 'Admin Operations',
          badge: 'MANAGEMENT',
          icon: Briefcase,
          color: '#C7CEFA'
        };
    }
  };

  const portalInfo = getPortalInfo();
  const PortalIcon = portalInfo.icon;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarWidth = isCollapsed ? 'var(--sidebar-width-collapsed, 72px)' : 'var(--sidebar-width, 260px)';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="sidebar-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'is-collapsed' : ''}`}
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar, #090d16)',
          color: 'var(--text-sidebar, #cbd5e1)',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-dark, #1e293b)',
          overflow: 'hidden'
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--topbar-height, 64px)',
            padding: isCollapsed ? '0 1rem' : '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid var(--border-dark, #1e293b)',
            gap: '0.75rem'
          }}
        >
          <Link
            to={`/${portal}/dashboard`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              overflow: 'hidden',
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary, #2C3480)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(44, 52, 128, 0.4)'
              }}
            >
              <Compass size={22} />
            </div>

            {!isCollapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.9375rem',
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    maxWidth: '165px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={portal === 'super-admin' ? 'MAK SAAS CLOUD' : currentCompany?.name || 'MAK TOURS ERP'}
                >
                  {portal === 'super-admin' ? 'MAK SAAS CLOUD' : (currentCompany?.name || 'MAK TOURS ERP').toUpperCase()}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-sidebar-muted, #94a3b8)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>{portalInfo.title}</span>
                  <span
                    style={{
                      fontSize: '0.5625rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: portalInfo.color,
                      padding: '0.0625rem 0.25rem',
                      borderRadius: '3px'
                    }}
                  >
                    {portalInfo.badge}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-sidebar)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? '0.75rem 0.5rem' : '0.875rem 0.75rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const menuKey = item.label || idx;
            const isOpen = Boolean(openSubmenus[menuKey]);

            // Check if any child route is active (respect child.end to prevent prefix collisions)
            const isChildActive = hasChildren
              ? item.children.some((child) =>
                  child.end
                    ? location.pathname === child.to
                    : location.pathname === child.to || location.pathname.startsWith(child.to + '/')
                )
              : false;

            if (hasChildren) {
              return (
                <div key={menuKey} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Parent Item Button */}
                  <div
                    onClick={() => {
                      if (isCollapsed && onToggleCollapse) {
                        onToggleCollapse(); // Auto expand sidebar if clicked in collapsed mode
                      }
                      toggleSubmenu(menuKey);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'space-between',
                      padding: isCollapsed ? '0.625rem 0' : '0.5625rem 0.75rem',
                      borderRadius: '8px',
                      color: isChildActive ? '#ffffff' : 'var(--text-sidebar, #cbd5e1)',
                      backgroundColor: isChildActive && !isOpen ? 'rgba(44, 52, 128, 0.35)' : 'transparent',
                      fontWeight: isChildActive ? 600 : 500,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      userSelect: 'none'
                    }}
                    title={isCollapsed ? item.label : undefined}
                    onMouseEnter={(e) => {
                      if (!isChildActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isChildActive || isOpen) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {Icon && <Icon size={18} style={{ flexShrink: 0, color: isChildActive ? '#C7CEFA' : 'inherit' }} />}
                      {!isCollapsed && <span>{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {item.badge && (
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(255, 255, 255, 0.12)',
                              color: '#ffffff',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '9999px'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown
                          size={14}
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            opacity: 0.7
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Submenu Children (Shown when open and not collapsed) */}
                  {isOpen && !isCollapsed && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem',
                        paddingLeft: '1.75rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        marginLeft: '1.25rem'
                      }}
                    >
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={Boolean(child.end)}
                          onClick={onCloseMobile}
                          style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.375rem 0.625rem',
                            borderRadius: '6px',
                            color: isActive ? '#ffffff' : 'var(--text-sidebar-muted, #94a3b8)',
                            backgroundColor: isActive ? 'var(--color-primary, #2C3480)' : 'transparent',
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          })}
                        >
                          <span>{child.label}</span>
                          {child.badge && (
                            <span
                              style={{
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                padding: '0.0625rem 0.25rem',
                                borderRadius: '4px'
                              }}
                            >
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Normal single navigation item
            // Check if another sibling item in navItems has a more specific path that matches current location
            const hasMoreSpecificMatch = navItems.some((other) => {
              if (!other.to || other === item) return false;
              if (other.to.startsWith(item.to + '/')) {
                return other.end
                  ? location.pathname === other.to
                  : location.pathname === other.to || location.pathname.startsWith(other.to + '/');
              }
              return false;
            });

            const isExactMatch = location.pathname === item.to;
            const isPrefixMatch = !item.end && item.to !== `/${portal}` && location.pathname.startsWith(item.to + '/');
            const active = isExactMatch || (isPrefixMatch && !hasMoreSpecificMatch);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={Boolean(item.end || hasMoreSpecificMatch)}
                onClick={onCloseMobile}
                style={() => {
                  return {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: isCollapsed ? '0.625rem 0' : '0.5625rem 0.75rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    borderRadius: '8px',
                    color: active ? '#ffffff' : 'var(--text-sidebar, #cbd5e1)',
                    backgroundColor: active ? 'var(--color-primary, #2C3480)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.8125rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  };
                }}
                title={isCollapsed ? item.label : undefined}
              >
                {Icon && <Icon size={18} style={{ flexShrink: 0 }} />}
                {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      backgroundColor: item.badgeColor || 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '9999px'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile / Collapse Controls */}
        <div
          style={{
            padding: '0.75rem',
            borderTop: '1px solid var(--border-dark, #1e293b)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* User mini bar - Click to Edit Profile */}
          <div
            onClick={() => setIsEditProfileOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '0.625rem',
              padding: '0.375rem 0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            title="Click to edit your profile"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary, #2C3480)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                overflow: 'hidden'
              }}
            >
              {currentUser?.avatar && !avatarError && (currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('/')) ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                (currentUser?.avatar || currentUser?.name || 'MK').substring(0, 2).toUpperCase()
              )}
            </div>

            {!isCollapsed && (
              <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.name || 'Ananya Deshmukh'}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-sidebar-muted, #94a3b8)', textTransform: 'capitalize' }}>
                  {String(currentUser?.designation || currentUser?.role || 'Operations Lead').replace(/chauffeur/gi, 'Driver').replace(/_/g, ' ')}
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Collapse Button + Logout (Logout hidden when collapsed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: 'var(--text-sidebar, #cbd5e1)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  transition: 'background-color 0.15s ease'
                }}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {!isCollapsed && <span>Collapse</span>}
              </button>
            )}

            {!isCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                title="Logout from ERP"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
}
