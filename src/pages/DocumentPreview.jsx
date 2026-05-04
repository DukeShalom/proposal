import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocument, getClients, sendDocument } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { ChevronLeft, Printer, Send, Check, Copy, ExternalLink, Loader } from 'lucide-react';

const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const unitLabel = (u) => u === 'hour' ? '/hr' : u === 'month' ? '/mo' : '';

function DocumentRenderer({ doc, client }) {
  const primaryColor = doc.branding?.primaryColor || '#c9a84c';
  const docNum = `DOC-${String(doc.id || '').slice(-4).toUpperCase().padStart(4, '0')}`;
  const typeLabels = { proposal: 'PROPOSAL', sow: 'STATEMENT OF WORK', contract: 'CONTRACT' };

  return (
    <div style={{
      background: 'white',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      color: '#1a1a2e',
      fontFamily: 'var(--font-body)',
    }} className="document-render">
      <style>{`
        @media print {
          .document-render { box-shadow: none !important; }
        }
      `}</style>

      {/* Color accent bar */}
      <div style={{ height: '8px', background: `linear-gradient(90deg, ${primaryColor} 0%, ${primaryColor}88 100%)` }} />

      {/* Header */}
      <div style={{ padding: '40px 48px 32px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '700', color: '#0a0e1a', letterSpacing: '-0.5px', lineHeight: '1.1' }}>
              {doc.branding?.companyName || 'ProposalGen'}
            </div>
            {doc.branding?.tagline && (
              <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                {doc.branding.tagline}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '600', marginBottom: '6px' }}>
              {typeLabels[doc.type] || 'DOCUMENT'}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600', color: primaryColor }}>
              {docNum}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
              {formatDate(doc.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Client & Document Info */}
      <div style={{ padding: '28px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px' }}>Prepared For</div>
          {client ? (
            <>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#0a0e1a', marginBottom: '3px' }}>{client.name}</div>
              {client.company && <div style={{ fontSize: '14px', color: '#374151', marginBottom: '2px' }}>{client.company}</div>}
              {client.email && <div style={{ fontSize: '13px', color: '#6b7280' }}>{client.email}</div>}
              {client.phone && <div style={{ fontSize: '13px', color: '#6b7280' }}>{client.phone}</div>}
              {client.address && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{client.address}</div>}
            </>
          ) : (
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Client information unavailable</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px' }}>Document Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Document #</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: 'monospace' }}>{docNum}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Date</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{formatDate(doc.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Type</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>{doc.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Status</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>{doc.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: '28px 48px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: '#0a0e1a' }}>{doc.title}</h1>
      </div>

      {/* Line Items Table */}
      {doc.lineItems && doc.lineItems.length > 0 && (
        <div style={{ padding: '0 48px 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: primaryColor }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: 'white', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>SERVICE</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: 'white', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>QTY</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>UNIT PRICE</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px' }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0a0e1a', marginBottom: '2px' }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>{item.description}</div>
                    )}
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', textTransform: 'capitalize' }}>{item.tier} tier</div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: '#374151', fontWeight: '500' }}>{item.quantity}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: '#374151' }}>
                    {formatCurrency(item.price)}{unitLabel(item.unit)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '700', color: '#0a0e1a' }}>
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', borderTop: '2px solid #e5e7eb' }}>
                <td colSpan={3} style={{ padding: '16px', fontWeight: '700', color: '#374151', fontSize: '15px', textAlign: 'right', paddingRight: '24px' }}>
                  TOTAL AMOUNT
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '24px',
                    fontWeight: '700',
                    color: primaryColor,
                  }}>
                    {formatCurrency(doc.totalAmount)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Notes */}
      {doc.notes && (
        <div style={{ padding: '20px 48px 28px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>Notes & Terms</div>
          <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{doc.notes}</div>
        </div>
      )}

      {/* Signature Block */}
      <div style={{ padding: '28px 48px 40px', borderTop: '2px solid #e5e7eb', background: '#fafafa' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '20px' }}>Signature</div>

        {doc.status === 'signed' ? (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={20} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0a0e1a', marginBottom: '4px' }}>Document Signed</div>
              {doc.signerName && <div style={{ fontSize: '13px', color: '#374151', marginBottom: '2px' }}>Signed by <strong>{doc.signerName}</strong></div>}
              {doc.signedAt && <div style={{ fontSize: '13px', color: '#6b7280' }}>on {formatDate(doc.signedAt)}</div>}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ height: '60px', borderBottom: '1px solid #374151', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Authorized Signature</div>
              {doc.branding?.companyName && <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{doc.branding.companyName}</div>}
            </div>
            <div>
              <div style={{ height: '60px', borderBottom: '1px solid #374151', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Client Signature</div>
              {client && <div style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{client.name}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [signLink, setSignLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docRes, clientsRes] = await Promise.all([getDocument(id), getClients()]);
        const d = docRes.data;
        setDoc(d);
        const c = (clientsRes.data || []).find(cl => cl.id === d.clientId);
        setClient(c || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSend = async () => {
    setSending(true);
    try {
      const r = await sendDocument(id);
      setSignLink(r.data.signUrl);
      setDoc(prev => ({ ...prev, status: 'sent' }));
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const copyLink = () => {
    if (signLink) {
      navigator.clipboard.writeText(signLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader size={20} style={{ animation: 'pulse 1.5s ease infinite' }} />
        Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: 'var(--danger)', marginBottom: '12px' }}>Failed to load document: {error}</div>
        <button onClick={() => navigate('/documents')} style={{ padding: '8px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          Back to Documents
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '900px', animation: 'pageIn 350ms ease both' }}>
      {/* Toolbar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/documents')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'var(--font-body)', padding: 0 }}
          >
            <ChevronLeft size={14} /> Documents
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {doc?.title}
            </h1>
            {doc && <StatusBadge status={doc.status} />}
            {doc && <StatusBadge type={doc.type} />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '9px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'var(--font-body)',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Printer size={14} /> Print
          </button>

          {doc?.status === 'draft' && (
            <button
              onClick={handleSend}
              disabled={sending}
              style={{
                padding: '9px 20px',
                background: sending ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
                border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0e1a',
                cursor: sending ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-body)',
                boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
              }}
            >
              {sending ? <Loader size={14} style={{ animation: 'pulse 1.5s ease infinite' }} /> : <Send size={14} />}
              {sending ? 'Sending...' : 'Send for Signature'}
            </button>
          )}

          {doc?.status === 'sent' && doc?.signToken && (
            <button
              onClick={() => {
                const link = `${window.location.origin}/sign/${doc.signToken}`;
                setSignLink(link);
              }}
              style={{
                padding: '9px 20px',
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 'var(--radius-sm)', color: '#60a5fa',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-body)',
              }}
            >
              <ExternalLink size={14} /> Copy Sign Link
            </button>
          )}
        </div>
      </div>

      {/* Sign link panel */}
      {signLink && (
        <div className="no-print" style={{
          marginBottom: '20px', padding: '16px 20px',
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '500', flexShrink: 0 }}>Sign Link:</span>
          <input readOnly value={signLink} style={{ flex: 1, padding: '6px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }} />
          <button
            onClick={copyLink}
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: copied ? 'var(--success)' : 'var(--info)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', transition: 'background 200ms' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied!' : 'Copy'}
          </button>
          <a href={signLink} target="_blank" rel="noopener noreferrer" style={{ padding: '7px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', textDecoration: 'none' }}>
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* Document */}
      {doc && <DocumentRenderer doc={doc} client={client} />}
    </div>
  );
}
