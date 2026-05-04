import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSignDocument, signDocument } from '../api.js';
import { Check, Shield, Loader, AlertCircle } from 'lucide-react';

const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Confetti particle
function Confetti() {
  const colors = ['#c9a84c', '#e8c96d', '#22c55e', '#3b82f6', '#a78bfa', '#f472b6', '#fb923c'];
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, overflow: 'hidden' }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size + 'px',
            height: p.shape === 'circle' ? p.size + 'px' : p.size * 0.5 + 'px',
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: '#1a2235',
  border: '1px solid #1e2d47',
  borderRadius: '8px',
  color: '#f0f4ff',
  fontSize: '15px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: 'none',
  transition: 'border-color 200ms, box-shadow 200ms',
};

function FocusInput({ value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? '#c9a84c' : '#1e2d47',
        boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.12)' : 'none',
      }}
    />
  );
}

function DocumentMini({ doc, client }) {
  const primaryColor = doc.branding?.primaryColor || '#c9a84c';
  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', color: '#1a1a2e', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <div style={{ height: '6px', background: primaryColor }} />
      <div style={{ padding: '32px 40px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: '700', color: '#0a0e1a' }}>
              {doc.branding?.companyName || 'ProposalGen'}
            </div>
            {doc.branding?.tagline && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '3px' }}>{doc.branding.tagline}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#9ca3af', fontWeight: '600' }}>{doc.type?.toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500', marginTop: '3px' }}>{formatDate(doc.createdAt)}</div>
          </div>
        </div>

        {client && (
          <div style={{ padding: '12px 16px', background: '#f8f9fa', borderRadius: '6px', borderLeft: `3px solid ${primaryColor}`, marginBottom: '20px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Prepared For</div>
            <div style={{ fontWeight: '700', color: '#0a0e1a', fontSize: '15px' }}>{client.name}</div>
            {client.company && <div style={{ color: '#555', fontSize: '13px' }}>{client.company}</div>}
            {client.email && <div style={{ color: '#6b7280', fontSize: '12px' }}>{client.email}</div>}
          </div>
        )}

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: '700', color: '#0a0e1a', marginBottom: '16px' }}>{doc.title}</div>

        {doc.lineItems?.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '8px' }}>
            <thead>
              <tr style={{ background: primaryColor }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '11px', letterSpacing: '0.5px' }}>SERVICE</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '11px' }}>QTY</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '11px' }}>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {doc.lineItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '500', color: '#0a0e1a' }}>{item.name}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#0a0e1a' }}>{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f0f0', borderTop: '2px solid #e0e0e0' }}>
                <td colSpan={2} style={{ padding: '12px', fontWeight: '700', color: '#374151', textAlign: 'right', paddingRight: '16px' }}>TOTAL</td>
                <td style={{ padding: '12px', textAlign: 'right', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: '700', color: primaryColor }}>{formatCurrency(doc.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {doc.notes && (
          <div style={{ marginTop: '16px', padding: '14px 16px', background: '#f8f9fa', borderRadius: '6px', fontSize: '12px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {doc.notes}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getSignDocument(token)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const validate = () => {
    const errs = {};
    if (!signerName.trim()) errs.name = 'Your name is required';
    if (!signerEmail.trim()) errs.email = 'Your email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signerEmail)) errs.email = 'Invalid email';
    if (!agreed) errs.agreed = 'You must agree to the terms';
    return errs;
  };

  const handleSign = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSigning(true);
    try {
      await signDocument(token, {
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
        ipAddress: 'client',
      });
      const now = new Date();
      setSignedAt(now);
      setSigned(true);
    } catch (e) {
      alert('Error signing: ' + e.message);
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#8899bb', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <Loader size={20} style={{ animation: 'pulse 1.5s ease infinite' }} />
        Loading document...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '480px' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', color: '#f0f4ff', marginBottom: '8px' }}>Document Not Found</h2>
          <p style={{ color: '#8899bb', fontSize: '15px', lineHeight: '1.6' }}>
            This signing link may be invalid, expired, or already used. Please contact the sender for assistance.
          </p>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#4a5a7a' }}>Error: {error}</div>
        </div>
      </div>
    );
  }

  const { document: doc, client } = data || {};

  if (signed) {
    return (
      <>
        <Confetti />
        <div style={{ minHeight: '100vh', background: '#0a0e1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, system-ui, sans-serif', padding: '40px 20px' }}>
          <div style={{ textAlign: 'center', maxWidth: '520px', animation: 'scaleIn 500ms cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 0 0 16px rgba(34,197,94,0.12), 0 0 0 32px rgba(34,197,94,0.06)',
              animation: 'scaleIn 600ms 200ms both cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <Check size={48} strokeWidth={3} style={{ color: 'white' }} />
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '36px', fontWeight: '700', color: '#f0f4ff', marginBottom: '12px', lineHeight: '1.2' }}>
              Document Signed Successfully
            </h1>

            <p style={{ color: '#8899bb', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
              Thank you, <strong style={{ color: '#f0f4ff' }}>{signerName}</strong>. Your signature has been recorded and the document is now legally binding.
            </p>

            <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8899bb' }}>Document</span>
                  <span style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '500' }}>{doc?.title}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8899bb' }}>Signed by</span>
                  <span style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '500' }}>{signerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8899bb' }}>Timestamp</span>
                  <span style={{ fontSize: '13px', color: '#f0f4ff', fontWeight: '500' }}>
                    {signedAt?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' at '}
                    {signedAt?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#8899bb' }}>Amount</span>
                  <span style={{ fontSize: '13px', color: '#c9a84c', fontWeight: '700', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px' }}>{formatCurrency(doc?.totalAmount)}</span>
                </div>
              </div>
            </div>

            <p style={{ color: '#4a5a7a', fontSize: '13px', marginTop: '20px' }}>
              A copy of this signed document will be sent to {signerEmail}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Header bar */}
      <div style={{ borderBottom: '1px solid #1e2d47', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0c1220' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #c9a84c, #e8c96d)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px', fontWeight: '700', color: '#0a0e1a' }}>PG</span>
          </div>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#f0f4ff', fontWeight: '600' }}>ProposalGen</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8899bb' }}>
          <Shield size={13} style={{ color: '#22c55e' }} />
          Secure E-Signature
        </div>
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Intro */}
        <div style={{ textAlign: 'center', marginBottom: '36px', animation: 'pageIn 350ms ease both' }}>
          <div style={{ fontSize: '11px', color: '#c9a84c', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '500', marginBottom: '10px' }}>
            E-Signature Request
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', fontWeight: '700', color: '#f0f4ff', marginBottom: '8px', lineHeight: '1.3' }}>
            You've been invited to sign a document
          </h1>
          {client && (
            <p style={{ color: '#8899bb', fontSize: '15px' }}>
              Please review the document below and sign electronically to proceed.
            </p>
          )}
        </div>

        {/* Document preview */}
        {doc && client && (
          <div style={{ marginBottom: '32px', animation: 'pageIn 400ms 100ms both' }}>
            <DocumentMini doc={doc} client={client} />
          </div>
        )}

        {/* Signature panel */}
        <div style={{
          background: '#111827',
          border: '1px solid #1e2d47',
          borderRadius: '16px',
          padding: '32px',
          animation: 'pageIn 400ms 200ms both',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#c9a84c', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: '500', marginBottom: '6px' }}>
              E-Signature Panel
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', color: '#f0f4ff', fontWeight: '600', marginBottom: '4px' }}>
              Sign Document
            </h2>
            <div style={{ fontSize: '13px', color: '#8899bb' }}>
              You are signing: <strong style={{ color: '#f0f4ff' }}>{doc?.title}</strong>
            </div>
            {client?.company && (
              <div style={{ fontSize: '13px', color: '#8899bb' }}>
                On behalf of: <strong style={{ color: '#f0f4ff' }}>{client.company}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#8899bb', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Your Full Name <span style={{ color: '#c9a84c' }}>*</span>
              </label>
              <FocusInput
                value={signerName}
                onChange={e => { setSignerName(e.target.value); setFormErrors(p => ({ ...p, name: undefined })); }}
                placeholder="Jane Smith"
              />
              {formErrors.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#8899bb', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Your Email Address <span style={{ color: '#c9a84c' }}>*</span>
              </label>
              <FocusInput
                type="email"
                value={signerEmail}
                onChange={e => { setSignerEmail(e.target.value); setFormErrors(p => ({ ...p, email: undefined })); }}
                placeholder="jane@example.com"
              />
              {formErrors.email && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
            </div>

            {/* Signature preview area */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#8899bb', marginBottom: '8px', letterSpacing: '0.3px' }}>
                Signature Preview
              </label>
              <div style={{
                padding: '20px 24px',
                background: 'white',
                border: '2px dashed #1e2d47',
                borderRadius: '10px',
                minHeight: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: signerName ? 'center' : 'flex-start',
                position: 'relative',
              }}>
                {signerName ? (
                  <div style={{
                    fontFamily: "'Dancing Script', cursive",
                    fontSize: '40px',
                    color: '#1a1a2e',
                    fontWeight: '700',
                    lineHeight: '1.2',
                    animation: 'fadeIn 200ms ease',
                  }}>
                    {signerName}
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                    Your signature will appear here as you type your name above
                  </span>
                )}
                {signerName && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '12px',
                    fontSize: '10px',
                    color: '#9ca3af',
                    fontFamily: 'DM Sans, system-ui',
                  }}>
                    E-Signature
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#4a5a7a', marginTop: '6px' }}>
                This cursive rendering of your name serves as your legally binding electronic signature.
              </div>
            </div>

            {/* Agreement checkbox */}
            <div style={{
              padding: '16px 20px',
              background: '#1a2235',
              borderRadius: '10px',
              border: `1px solid ${formErrors.agreed ? 'rgba(239,68,68,0.3)' : '#1e2d47'}`,
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); setFormErrors(p => ({ ...p, agreed: undefined })); }}
                  style={{ width: '18px', height: '18px', marginTop: '1px', accentColor: '#c9a84c', cursor: 'pointer', flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: '14px', color: '#f0f4ff', lineHeight: '1.5', marginBottom: '4px' }}>
                    I agree to the terms and conditions of this document
                  </div>
                  <div style={{ fontSize: '12px', color: '#4a5a7a', lineHeight: '1.5' }}>
                    By checking this box and clicking "Sign Document", I acknowledge that my electronic signature is legally equivalent to my handwritten signature and constitutes acceptance of all terms herein.
                  </div>
                </div>
              </label>
              {formErrors.agreed && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', display: 'block' }}>{formErrors.agreed}</span>}
            </div>

            {/* Sign button */}
            <button
              onClick={handleSign}
              disabled={signing}
              style={{
                width: '100%',
                padding: '16px',
                background: signing ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, #c9a84c 0%, #e8c96d 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0e1a',
                fontSize: '16px',
                fontWeight: '700',
                cursor: signing ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: signing ? 'none' : '0 6px 24px rgba(201,168,76,0.35)',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => { if (!signing) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = signing ? 'none' : '0 6px 24px rgba(201,168,76,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {signing ? (
                <><Loader size={18} style={{ animation: 'pulse 1.5s ease infinite' }} /> Signing...</>
              ) : (
                <><Check size={18} strokeWidth={3} /> Sign Document</>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#4a5a7a' }}>
              <Shield size={13} style={{ color: '#22c55e' }} />
              Secured with 256-bit encryption · Timestamp recorded · IP logged
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
