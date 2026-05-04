import React from 'react';

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    bg: 'rgba(100,116,139,0.18)',
    color: '#94a3b8',
    border: 'rgba(100,116,139,0.3)',
    dot: '#64748b',
  },
  sent: {
    label: 'Sent',
    bg: 'rgba(59,130,246,0.15)',
    color: '#60a5fa',
    border: 'rgba(59,130,246,0.3)',
    dot: '#3b82f6',
  },
  signed: {
    label: 'Signed',
    bg: 'rgba(34,197,94,0.12)',
    color: '#4ade80',
    border: 'rgba(34,197,94,0.3)',
    dot: '#22c55e',
  },
  declined: {
    label: 'Declined',
    bg: 'rgba(239,68,68,0.12)',
    color: '#f87171',
    border: 'rgba(239,68,68,0.3)',
    dot: '#ef4444',
  },
};

const TYPE_CONFIG = {
  proposal: { label: 'Proposal', bg: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: 'rgba(201,168,76,0.3)' },
  sow: { label: 'SOW', bg: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  contract: { label: 'Contract', bg: 'rgba(236,72,153,0.12)', color: '#f472b6', border: 'rgba(236,72,153,0.3)' },
};

export default function StatusBadge({ status, type, size = 'sm' }) {
  const config = type ? TYPE_CONFIG[type] : STATUS_CONFIG[status];
  if (!config) return null;

  const isSmall = size === 'sm';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: isSmall ? '3px 9px' : '4px 12px',
      borderRadius: '999px',
      fontSize: isSmall ? '11px' : '12px',
      fontWeight: '500',
      letterSpacing: '0.3px',
      background: config.bg,
      color: config.color,
      border: `1px solid ${config.border}`,
      whiteSpace: 'nowrap',
    }}>
      {!type && (
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
          boxShadow: `0 0 4px ${config.dot}`,
        }} />
      )}
      {config.label}
    </span>
  );
}
