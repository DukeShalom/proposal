import React, { useState } from 'react';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-body)',
  transition: 'border-color var(--transition), box-shadow var(--transition)',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  letterSpacing: '0.3px',
};

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: 'var(--accent-gold)', marginLeft: '3px' }}>*</span>}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', error }) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--danger)' : focused ? 'var(--accent-gold)' : 'var(--border-light)',
          boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.12)' : 'none',
        }}
      />
      {error && <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{error}</span>}
    </>
  );
}

export default function ClientForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    company: initial.company || '',
    email: initial.email || '',
    phone: initial.phone || '',
    address: initial.address || '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Full Name" required>
          <Input value={form.name} onChange={set('name')} placeholder="Jane Smith" error={errors.name} />
        </Field>
        <Field label="Company">
          <Input value={form.company} onChange={set('company')} placeholder="Acme Corp" />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set('email')} placeholder="jane@acme.com" error={errors.email} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
        </Field>
      </div>
      <Field label="Address">
        <Input value={form.address} onChange={set('address')} placeholder="123 Business Ave, New York, NY 10001" />
      </Field>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '9px 20px',
            background: 'transparent',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '9px 24px',
            background: loading ? 'rgba(201,168,76,0.5)' : 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#0a0e1a',
            fontSize: '13px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all var(--transition)',
            boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
          }}
        >
          {loading ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </form>
  );
}
