import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, getClients, deleteDocument } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { PlusCircle, FileText, ChevronRight, Trash2, Calendar, DollarSign } from 'lucide-react';

const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TYPE_LABELS = { proposal: 'Proposal', sow: 'SOW', contract: 'Contract' };
const TYPE_ICONS = { proposal: '📋', sow: '📄', contract: '✍️' };

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([getDocuments(), getClients()])
      .then(([d, c]) => {
        setDocuments(d.data || []);
        setClients(c.data || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const clientMap = clients.reduce((m, c) => ({ ...m, [c.id]: c }), {});

  const filtered = documents.filter(d => {
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', animation: 'pageIn 350ms ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Document Center</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Documents</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => navigate('/documents/new')}
          style={{
            padding: '11px 20px',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#0a0e1a', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
            fontFamily: 'var(--font-body)', boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <PlusCircle size={15} /> New Document
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'proposal', label: 'Proposals' },
            { key: 'sow', label: 'SOWs' },
            { key: 'contract', label: 'Contracts' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              style={{
                padding: '7px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
                border: typeFilter === tab.key ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                background: typeFilter === tab.key ? 'var(--accent-gold-dim)' : 'var(--bg-card)',
                color: typeFilter === tab.key ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
              }}
            >{tab.label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {['all', 'draft', 'sent', 'signed', 'declined'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '500',
                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all var(--transition)',
                border: statusFilter === s ? '1px solid var(--border-light)' : '1px solid var(--border)',
                background: statusFilter === s ? 'var(--bg-surface)' : 'transparent',
                color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                textTransform: 'capitalize',
              }}
            >{s === 'all' ? 'All Status' : s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: '160px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Error: {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '100px 40px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <FileText size={40} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {typeFilter !== 'all' || statusFilter !== 'all' ? 'No documents match your filters' : 'No documents yet'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Create your first document to get started
          </div>
          <button
            onClick={() => navigate('/documents/new')}
            style={{
              marginTop: '20px', padding: '10px 20px',
              background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
              border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0e1a',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >New Document</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map((doc, i) => {
            const client = clientMap[doc.clientId];
            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  opacity: deleting === doc.id ? 0.4 : 1,
                  animation: `pageIn 300ms ${i * 40}ms both`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Status accent bar */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: doc.status === 'signed' ? 'var(--success)' : doc.status === 'sent' ? 'var(--info)' : doc.status === 'declined' ? 'var(--danger)' : 'var(--border-light)',
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusBadge type={doc.type} />
                    <StatusBadge status={doc.status} />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc.id)}
                    disabled={deleting === doc.id}
                    style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)', flexShrink: 0 }}
                    onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {doc.title}
                  </h3>
                  {client && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {client.name}{client.company ? ` · ${client.company}` : ''}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(doc.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600', color: 'var(--accent-gold)' }}>
                      {formatCurrency(doc.totalAmount)}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
