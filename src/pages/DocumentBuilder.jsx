import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getClients, getServices, createDocument, sendDocument } from '../api.js';
import LineItemSelector from '../components/LineItemSelector.jsx';
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink, FileText, Loader } from 'lucide-react';

const STEPS = [
  { label: 'Client & Type', num: 1 },
  { label: 'Line Items', num: 2 },
  { label: 'Notes & Terms', num: 3 },
  { label: 'Preview & Send', num: 4 },
];

const TYPE_BOILERPLATE = {
  proposal: 'This proposal is valid for 30 days from the date of issue. Prices are subject to change after expiration. Acceptance of this proposal constitutes agreement to proceed with the described scope of work.',
  sow: 'Work begins upon signed agreement and deposit receipt. Any changes to the scope of work described herein must be agreed upon in writing by both parties. Milestone deliverables will be reviewed and approved before proceeding.',
  contract: 'This agreement is legally binding upon e-signature by all parties. By signing, both parties agree to all terms and conditions outlined in this document. Governing law: applicable jurisdiction laws apply.',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  letterSpacing: '0.3px',
};

function FInput({ value, onChange, placeholder, type = 'text', required }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--accent-gold)' : 'var(--border-light)',
        boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.12)' : 'none',
      }}
    />
  );
}

const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function PreviewMini({ form, clients, lineItems }) {
  const client = clients.find(c => c.id === form.clientId);
  const total = lineItems.reduce((s, li) => s + li.subtotal, 0);
  const primaryColor = form.branding.primaryColor || '#c9a84c';

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', fontSize: '12px', color: '#1a1a2e' }}>
      {/* Doc header bar */}
      <div style={{ background: primaryColor, height: '6px' }} />
      <div style={{ padding: '24px 28px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: '#0a0e1a' }}>
              {form.branding.companyName || 'Your Company'}
            </div>
            {form.branding.tagline && <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{form.branding.tagline}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{form.type.toUpperCase()}</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#333', marginTop: '2px' }}>{formatDate(new Date())}</div>
          </div>
        </div>

        {client && (
          <div style={{ padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px', borderLeft: `3px solid ${primaryColor}`, marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Prepared For</div>
            <div style={{ fontWeight: '600', color: '#1a1a2e' }}>{client.name}</div>
            {client.company && <div style={{ color: '#555', fontSize: '11px' }}>{client.company}</div>}
          </div>
        )}

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '600', color: '#0a0e1a', marginBottom: '10px' }}>{form.title || 'Untitled Document'}</div>

        {lineItems.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: primaryColor }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: 'white', fontWeight: '600' }}>Service</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'white', fontWeight: '600' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 10px', color: '#333' }}>{li.name} × {li.quantity}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: '600', color: '#0a0e1a' }}>{formatCurrency(li.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f0f0f0', borderTop: '2px solid #ddd' }}>
                <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0a0e1a' }}>Total</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: '700', color: primaryColor }}>{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

export default function DocumentBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    clientId: preselectedClientId || '',
    type: 'proposal',
    title: '',
    branding: { companyName: '', primaryColor: '#c9a84c', tagline: '' },
  });
  const [lineItems, setLineItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [useBoilerplate, setUseBoilerplate] = useState(true);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedDoc, setSavedDoc] = useState(null);
  const [signLink, setSignLink] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getClients(), getServices()])
      .then(([c, s]) => {
        setClients(c.data || []);
        setServices(s.data || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  const total = lineItems.reduce((s, li) => s + li.subtotal, 0);

  const setFormField = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setBranding = (field, value) => setForm(f => ({ ...f, branding: { ...f.branding, [field]: value } }));

  const canProceed = () => {
    if (step === 1) return form.clientId && form.type && form.title.trim();
    if (step === 2) return lineItems.length > 0;
    return true;
  };

  const buildPayload = () => ({
    clientId: form.clientId,
    type: form.type,
    title: form.title,
    lineItems,
    notes: notes + (useBoilerplate ? '\n\n' + TYPE_BOILERPLATE[form.type] : ''),
    branding: form.branding,
    totalAmount: total,
  });

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const r = await createDocument({ ...buildPayload(), status: 'draft' });
      setSavedDoc(r.data);
    } catch (e) {
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendForSignature = async () => {
    setSending(true);
    try {
      let doc = savedDoc;
      if (!doc) {
        const r = await createDocument({ ...buildPayload(), status: 'draft' });
        doc = r.data;
        setSavedDoc(doc);
      }
      const sr = await sendDocument(doc.id);
      setSignLink(sr.data.signUrl);
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

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238899bb' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: 'var(--text-muted)' }}>
        <Loader size={20} style={{ animation: 'pulse 1.5s ease infinite' }} />
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: '900px', animation: 'pageIn 350ms ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/documents')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontFamily: 'var(--font-body)', marginBottom: '16px', padding: 0 }}
        >
          <ChevronLeft size={14} /> Back to Documents
        </button>
        <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>New Document</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Document Builder</h1>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px', gap: '0' }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: s.num < step ? 'pointer' : 'default' }}
              onClick={() => s.num < step && setStep(s.num)}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '600', transition: 'all var(--transition)',
                background: s.num < step ? 'var(--success)' : s.num === step ? 'var(--accent-gold)' : 'var(--bg-surface)',
                color: s.num <= step ? '#0a0e1a' : 'var(--text-muted)',
                border: s.num > step ? '1px solid var(--border)' : 'none',
                boxShadow: s.num === step ? '0 0 0 4px rgba(201,168,76,0.2)' : 'none',
              }}>
                {s.num < step ? <Check size={14} /> : s.num}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>Step {s.num}</span>
                <span style={{ fontSize: '13px', fontWeight: s.num === step ? '600' : '400', color: s.num === step ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: '1px', background: s.num < step ? 'var(--success)' : 'var(--border)', margin: '0 12px', marginTop: '-12px', transition: 'background 300ms ease' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '24px' }}>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'pageIn 300ms ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>Client & Document Type</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Client <span style={{ color: 'var(--accent-gold)' }}>*</span></label>
                <select
                  value={form.clientId}
                  onChange={e => setFormField('clientId', e.target.value)}
                  style={selectStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>
                    No clients yet. <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/clients')}>Add a client first.</span>
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Document Title <span style={{ color: 'var(--accent-gold)' }}>*</span></label>
                <FInput
                  value={form.title}
                  onChange={e => setFormField('title', e.target.value)}
                  placeholder="e.g. Website Redesign Proposal"
                />
              </div>
            </div>

            {/* Document type */}
            <div>
              <label style={{ ...labelStyle, marginBottom: '12px' }}>Document Type <span style={{ color: 'var(--accent-gold)' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { key: 'proposal', label: 'Proposal', desc: 'Pitch your services and pricing to a potential client', icon: '📋' },
                  { key: 'sow', label: 'Statement of Work', desc: 'Define deliverables, timelines, and acceptance criteria', icon: '📄' },
                  { key: 'contract', label: 'Contract', desc: 'Legally binding service agreement with e-signature', icon: '✍️' },
                ].map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFormField('type', t.key)}
                    style={{
                      padding: '16px',
                      background: form.type === t.key ? 'var(--accent-gold-dim)' : 'var(--bg-surface)',
                      border: `2px solid ${form.type === t.key ? 'var(--accent-gold)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <div style={{ fontSize: '22px', marginBottom: '8px' }}>{t.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: form.type === t.key ? 'var(--accent-gold-light)' : 'var(--text-primary)', marginBottom: '4px' }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Branding */}
            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--accent-gold)' }}>✦</span> Your Branding
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Company Name</label>
                  <FInput value={form.branding.companyName} onChange={e => setBranding('companyName', e.target.value)} placeholder="Acme Studios" />
                </div>
                <div>
                  <label style={labelStyle}>Tagline</label>
                  <FInput value={form.branding.tagline} onChange={e => setBranding('tagline', e.target.value)} placeholder="Creative solutions for modern brands" />
                </div>
                <div>
                  <label style={labelStyle}>Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={form.branding.primaryColor}
                      onChange={e => setBranding('primaryColor', e.target.value)}
                      style={{ width: '42px', height: '42px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--bg-surface)', padding: '2px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{form.branding.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ animation: 'pageIn 300ms ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600', marginBottom: '24px' }}>Services & Line Items</h2>
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <FileText size={32} strokeWidth={1} style={{ marginBottom: '12px', opacity: 0.4 }} />
                <div style={{ fontSize: '15px', marginBottom: '6px' }}>No services in catalog</div>
                <p style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--accent-gold)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/services')}>Add services</span> to your catalog first.
                </p>
              </div>
            ) : (
              <LineItemSelector services={services} lineItems={lineItems} onChange={setLineItems} />
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'pageIn 300ms ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>Notes & Terms</h2>

            <div>
              <label style={labelStyle}>Notes / Scope Description</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Describe the scope of work, deliverables, timeline, payment terms, or any special notes for the client..."
                rows={8}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '160px',
                  lineHeight: '1.6',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ padding: '16px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="boilerplate"
                  checked={useBoilerplate}
                  onChange={e => setUseBoilerplate(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: 'var(--accent-gold)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="boilerplate" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', cursor: 'pointer', display: 'block', marginBottom: '6px' }}>
                    Include standard {form.type} terms
                  </label>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic', borderLeft: '2px solid var(--accent-gold)', paddingLeft: '10px' }}>
                    "{TYPE_BOILERPLATE[form.type]}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'pageIn 300ms ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '600' }}>Preview & Send</h2>

            <PreviewMini form={form} clients={clients} lineItems={lineItems} />

            <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500', textTransform: 'capitalize' }}>{form.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Line Items</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{lineItems.length} service{lineItems.length !== 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Amount</div>
                  <div style={{ fontSize: '16px', color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{formatCurrency(total)}</div>
                </div>
              </div>
            </div>

            {signLink ? (
              <div style={{ padding: '20px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Check size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--success)' }}>Document sent! Share this link with your client:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    readOnly
                    value={signLink}
                    style={{ ...inputStyle, flex: 1, background: 'rgba(0,0,0,0.2)', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={copyLink}
                    style={{
                      padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
                      background: copied ? 'var(--success)' : 'var(--accent-gold)', color: '#0a0e1a',
                      cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <a
                    href={signLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', textDecoration: 'none', transition: 'all var(--transition)' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => navigate('/documents')}
                    style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                  >
                    Back to Documents
                  </button>
                  {savedDoc && (
                    <button
                      onClick={() => navigate(`/documents/${savedDoc.id}`)}
                      style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)' }}
                    >
                      View Document
                    </button>
                  )}
                </div>
              </div>
            ) : savedDoc ? (
              <div style={{ padding: '16px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} style={{ color: 'var(--accent-gold)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: '500' }}>Draft saved successfully</span>
                </div>
                <button
                  onClick={() => navigate(`/documents/${savedDoc.id}`)}
                  style={{ fontSize: '12px', color: 'var(--accent-gold)', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}
                >
                  View Document →
                </button>
              </div>
            ) : null}

            {!signLink && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || sending}
                  style={{
                    padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '14px',
                    fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all var(--transition)',
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {saving ? <Loader size={14} style={{ animation: 'pulse 1.5s ease infinite' }} /> : null}
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={handleSendForSignature}
                  disabled={saving || sending}
                  style={{
                    flex: 1, padding: '12px 24px',
                    background: sending ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
                    border: 'none', borderRadius: 'var(--radius-sm)', color: '#0a0e1a',
                    fontSize: '14px', fontWeight: '700', cursor: sending ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-body)', boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'all var(--transition)',
                  }}
                >
                  {sending ? <Loader size={14} style={{ animation: 'pulse 1.5s ease infinite' }} /> : null}
                  {sending ? 'Sending...' : 'Send for Signature →'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            style={{
              padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: step === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
              cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Step {step} of {STEPS.length}</div>

          <button
            onClick={() => setStep(s => Math.min(4, s + 1))}
            disabled={!canProceed()}
            style={{
              padding: '10px 24px',
              background: canProceed() ? 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)' : 'var(--bg-surface)',
              border: canProceed() ? 'none' : '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: canProceed() ? '#0a0e1a' : 'var(--text-muted)',
              cursor: canProceed() ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '600',
              fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all var(--transition)',
              boxShadow: canProceed() ? '0 4px 12px rgba(201,168,76,0.25)' : 'none',
            }}
          >
            {step === 3 ? 'Review Document' : 'Continue'} <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
