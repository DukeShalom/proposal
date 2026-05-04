import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';

const TIER_COLORS = {
  basic: { color: '#8899bb', bg: 'rgba(136,153,187,0.1)', border: 'rgba(136,153,187,0.25)' },
  standard: { color: 'var(--accent-gold)', bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.25)' },
  premium: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
};

const unitLabel = (unit) => unit === 'hour' ? '/hr' : unit === 'month' ? '/mo' : ' flat';

const formatCurrency = (v) => {
  const n = Number(v) || 0;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function LineItemSelector({ services, lineItems, onChange }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchTier = tierFilter === 'all' || s.tier === tierFilter;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase());
      return matchTier && matchSearch;
    });
  }, [services, search, tierFilter]);

  const addItem = (service) => {
    const exists = lineItems.find(li => li.serviceId === service.id);
    if (exists) return;
    onChange([...lineItems, {
      serviceId: service.id,
      name: service.name,
      description: service.description,
      tier: service.tier,
      price: service.price,
      quantity: 1,
      unit: service.unit,
      subtotal: service.price,
    }]);
  };

  const removeItem = (serviceId) => {
    onChange(lineItems.filter(li => li.serviceId !== serviceId));
  };

  const updateQty = (serviceId, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    onChange(lineItems.map(li =>
      li.serviceId === serviceId
        ? { ...li, quantity: q, subtotal: li.price * q }
        : li
    ));
  };

  const total = lineItems.reduce((sum, li) => sum + li.subtotal, 0);
  const isAdded = (id) => lineItems.some(li => li.serviceId === id);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', minHeight: '420px' }}>
      {/* Left: Service Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Service Catalog
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 32px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
            }}
          />
        </div>

        {/* Tier tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'basic', 'standard', 'premium'].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all var(--transition)',
                border: tierFilter === t ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
                background: tierFilter === t ? 'var(--accent-gold-dim)' : 'transparent',
                color: tierFilter === t ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Service list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '320px', paddingRight: '4px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No services found
            </div>
          ) : filtered.map(service => {
            const tc = TIER_COLORS[service.tier];
            const added = isAdded(service.id);
            return (
              <div
                key={service.id}
                style={{
                  padding: '12px',
                  background: added ? 'rgba(201,168,76,0.06)' : 'var(--bg-surface)',
                  border: `1px solid ${added ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  transition: 'all var(--transition)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{service.name}</span>
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 7px',
                      borderRadius: '99px',
                      background: tc.bg,
                      color: tc.color,
                      border: `1px solid ${tc.border}`,
                    }}>{service.tier}</span>
                  </div>
                  {service.description && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {service.description}
                    </div>
                  )}
                  <div style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: '600' }}>
                    {formatCurrency(service.price)}{unitLabel(service.unit)}
                  </div>
                </div>
                <button
                  onClick={() => !added && addItem(service)}
                  disabled={added}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: added ? 'rgba(201,168,76,0.15)' : 'var(--accent-gold)',
                    color: added ? 'var(--accent-gold)' : '#0a0e1a',
                    cursor: added ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    transition: 'all var(--transition)',
                  }}
                >
                  {added ? '✓' : <Plus size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Selected Items ({lineItems.length})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto', maxHeight: '340px', paddingRight: '4px' }}>
          {lineItems.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              textAlign: 'center',
              gap: '8px',
            }}>
              <Plus size={24} strokeWidth={1} />
              Add services from the catalog
            </div>
          ) : lineItems.map((item) => (
            <div
              key={item.serviceId}
              style={{
                padding: '12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {formatCurrency(item.price)}{unitLabel(item.unit)}
                </div>
              </div>

              {/* Qty */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => updateQty(item.serviceId, item.quantity - 1)}
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                >−</button>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.serviceId, item.quantity + 1)}
                  style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}
                >+</button>
              </div>

              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-gold)', minWidth: '80px', textAlign: 'right' }}>
                {formatCurrency(item.subtotal)}
              </div>

              <button
                onClick={() => removeItem(item.serviceId)}
                style={{ width: '26px', height: '26px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          padding: '16px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderTop: '2px solid var(--accent-gold)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '600', color: 'var(--accent-gold-light)' }}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
