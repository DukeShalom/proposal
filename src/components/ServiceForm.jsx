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

function FocusInput({ component: Comp = 'input', style: s = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <Comp
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
      style={{
        ...inputStyle,
        borderColor: focused ? 'var(--accent-gold)' : 'var(--border-light)',
        boxShadow: focused ? '0 0 0 3px rgba(201,168,76,0.12)' : 'none',
        ...s,
      }}
    />
  );
}

const TIER_COLORS = {
  basic: '#8899bb',
  standard: 'var(--accent-gold)',
  premium: '#a78bfa',
};

export default function ServiceForm({ initial = {}, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    description: initial.description || '',
    tier: initial.tier || 'standard',
    price: initial.price !== undefined ? String(initial.price) : '',
    unit: initial.unit || 'hour',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Service name is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Valid price required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit({ ...form, price: parseFloat(form.price) });
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238899bb' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Service Name <span style={{ color: 'var(--accent-gold)' }}>*</span></label>
        <FocusInput
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Brand Strategy Consultation"
        />
        {errors.name && <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <FocusInput
          component="textarea"
          value={form.description}
          onChange={set('description')}
          placeholder="Describe what this service includes..."
          rows={3}
          style={{ resize: 'vertical', minHeight: '80px', lineHeight: '1.5' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Tier</label>
          <select value={form.tier} onChange={set('tier')} style={{ ...selectStyle, borderLeft: `3px solid ${TIER_COLORS[form.tier]}` }}>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Price <span style={{ color: 'var(--accent-gold)' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>$</span>
            <FocusInput
              type="number"
              value={form.price}
              onChange={set('price')}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{ paddingLeft: '26px' }}
            />
          </div>
          {errors.price && <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', display: 'block' }}>{errors.price}</span>}
        </div>
        <div>
          <label style={labelStyle}>Unit</label>
          <select value={form.unit} onChange={set('unit')} style={selectStyle}>
            <option value="hour">Per Hour</option>
            <option value="flat">Flat Rate</option>
            <option value="month">Per Month</option>
          </select>
        </div>
      </div>

      {/* Tier preview */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${TIER_COLORS[form.tier]}33`,
        borderLeft: `3px solid ${TIER_COLORS[form.tier]}`,
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Preview</div>
        <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
          {form.name || 'Service Name'} — {form.tier.charAt(0).toUpperCase() + form.tier.slice(1)} tier
        </div>
        <div style={{ fontSize: '14px', color: 'var(--accent-gold)', fontWeight: '600', marginTop: '2px' }}>
          ${form.price || '0.00'} / {form.unit === 'hour' ? 'hr' : form.unit === 'flat' ? 'flat' : 'mo'}
        </div>
      </div>

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
          }}
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
          }}
        >
          {loading ? 'Saving...' : 'Save Service'}
        </button>
      </div>
    </form>
  );
}
