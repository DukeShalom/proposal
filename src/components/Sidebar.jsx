import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/services', icon: Briefcase, label: 'Services' },
  { to: '/documents', icon: FileText, label: 'Documents' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'linear-gradient(180deg, #0c1220 0%, #0a0e1a 100%)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      height: '100vh',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 24px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(201,168,76,0.35)',
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: '700',
              color: '#0a0e1a',
              letterSpacing: '-0.5px',
            }}>PG</span>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              letterSpacing: '0.3px',
              lineHeight: '1.2',
            }}>ProposalGen</div>
            <div style={{
              fontSize: '11px',
              color: 'var(--accent-gold)',
              letterSpacing: '0.5px',
              opacity: 0.8,
            }}>Professional Suite</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: 'var(--text-muted)',
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          padding: '4px 12px 8px',
        }}>Navigation</div>

        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? '500' : '400',
              color: isActive ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
              background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-gold)' : '2px solid transparent',
              transition: 'all var(--transition)',
              position: 'relative',
            })}
            className="nav-link"
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        <style>{`
          .nav-link:hover {
            background: rgba(255,255,255,0.04) !important;
            color: var(--text-primary) !important;
          }
        `}</style>
      </nav>

      {/* New Document CTA */}
      <div style={{ padding: '16px 12px 24px' }}>
        <button
          onClick={() => navigate('/documents/new')}
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
            color: '#0a0e1a',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all var(--transition)',
            boxShadow: '0 4px 16px rgba(201,168,76,0.25)',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(201,168,76,0.45)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,168,76,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <PlusCircle size={15} />
          New Document
        </button>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Version</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ProposalGen v1.0</div>
        </div>
      </div>
    </aside>
  );
}
