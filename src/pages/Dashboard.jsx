import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, getDocuments } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { Users, FileText, Clock, DollarSign, PlusCircle, UserPlus, ArrowRight, TrendingUp } from 'lucide-react';

const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent-gold)', delay = 0 }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color var(--transition), box-shadow var(--transition)',
      animation: `pageIn 400ms ${delay}ms both cubic-bezier(0.4,0,0.2,1)`,
      cursor: 'default',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'var(--border-light)';
      e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <TrendingUp size={14} style={{ color: 'var(--success)', opacity: 0.6 }} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.1' }}>
          {value}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getClients(), getDocuments()])
      .then(([c, d]) => {
        setClients(c.data || []);
        setDocuments(d.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = documents.filter(d => d.status === 'sent').length;
  const revenue = documents
    .filter(d => d.status === 'signed')
    .reduce((sum, d) => sum + (d.totalAmount || 0), 0);

  const recent = [...documents]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  // Map clientId → client
  const clientMap = clients.reduce((m, c) => ({ ...m, [c.id]: c }), {});

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', animation: 'pageIn 350ms ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>
          Overview
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.2' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          {formatDate(new Date())} — Your business at a glance
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: '140px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', marginBottom: '24px' }}>
          Failed to load data: {error}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
            <StatCard icon={Users} label="Total Clients" value={clients.length} sub="Active relationships" delay={0} />
            <StatCard icon={FileText} label="Documents" value={documents.length} sub="All time" color="var(--info)" delay={80} />
            <StatCard icon={Clock} label="Awaiting Signature" value={pending} sub={pending === 1 ? 'Document sent' : 'Documents sent'} color="var(--warning)" delay={160} />
            <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(revenue)} sub="From signed docs" color="var(--success)" delay={240} />
          </div>

          {/* Content grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
            {/* Recent Documents */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              animation: 'pageIn 400ms 300ms both',
            }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Documents</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Latest proposals & contracts</p>
                </div>
                <button
                  onClick={() => navigate('/documents')}
                  style={{ fontSize: '12px', color: 'var(--accent-gold)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-body)', fontWeight: '500' }}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>

              {recent.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={32} strokeWidth={1} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <div style={{ fontSize: '14px' }}>No documents yet</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Create your first proposal to get started</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Title', 'Client', 'Type', 'Status', 'Amount', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((doc, i) => {
                        const client = clientMap[doc.clientId];
                        return (
                          <tr
                            key={doc.id}
                            onClick={() => navigate(`/documents/${doc.id}`)}
                            style={{
                              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
                              cursor: 'pointer',
                              transition: 'background var(--transition)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {doc.title}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                              {client ? client.name : '—'}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <StatusBadge type={doc.type} />
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <StatusBadge status={doc.status} />
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--accent-gold)', fontWeight: '600', fontFamily: 'var(--font-display)' }}>
                              {formatCurrency(doc.totalAmount)}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {formatDate(doc.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'pageIn 400ms 380ms both' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/documents/new')}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: '#0a0e1a',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'var(--font-body)',
                      transition: 'all var(--transition)',
                      boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <PlusCircle size={15} /> New Proposal
                  </button>
                  <button
                    onClick={() => navigate('/clients')}
                    style={{
                      padding: '12px 16px',
                      background: 'transparent',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'var(--font-body)',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <UserPlus size={15} /> Add Client
                  </button>
                </div>
              </div>

              {/* Mini status breakdown */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Document Status</h3>
                {['draft', 'sent', 'signed', 'declined'].map(s => {
                  const count = documents.filter(d => d.status === s).length;
                  const pct = documents.length > 0 ? (count / documents.length) * 100 : 0;
                  const colors = { draft: '#64748b', sent: '#3b82f6', signed: '#22c55e', declined: '#ef4444' };
                  return (
                    <div key={s} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500' }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colors[s], borderRadius: '2px', transition: 'width 600ms ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
