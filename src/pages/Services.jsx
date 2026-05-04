import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService } from '../api.js';
import Modal from '../components/Modal.jsx';
import ServiceForm from '../components/ServiceForm.jsx';
import { Plus, Edit2, Trash2, Briefcase } from 'lucide-react';

const TIER_CONFIG = {
  basic: { label: 'Basic', color: '#8899bb', bg: 'rgba(136,153,187,0.08)', border: 'rgba(136,153,187,0.2)', accent: '#8899bb' },
  standard: { label: 'Standard', color: 'var(--accent-gold)', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)', accent: '#c9a84c' },
  premium: { label: 'Premium', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', accent: '#a78bfa' },
};

const unitLabel = (u) => u === 'hour' ? '/hr' : u === 'month' ? '/mo' : ' flat';
const formatCurrency = (v) => '$' + (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ServiceCard({ service, onEdit, onDelete, deleting }) {
  const tc = TIER_CONFIG[service.tier] || TIER_CONFIG.standard;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${tc.border}`,
      borderTop: `3px solid ${tc.accent}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all var(--transition)',
      opacity: deleting ? 0.4 : 1,
      position: 'relative',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Tier badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          padding: '3px 10px',
          borderRadius: '99px',
          background: tc.bg,
          color: tc.color,
          border: `1px solid ${tc.border}`,
        }}>{tc.label}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onEdit(service)}
            style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--info)'; e.currentTarget.style.color = 'var(--info)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: '1.3' }}>
          {service.name}
        </h3>
        {service.description && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {service.description}
          </p>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '600', color: tc.color, lineHeight: '1' }}>
            {formatCurrency(service.price)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
            per {service.unit === 'hour' ? 'hour' : service.unit === 'month' ? 'month' : 'project'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tierFilter, setTierFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getServices()
      .then(r => setServices(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = tierFilter === 'all' ? services : services.filter(s => s.tier === tierFilter);

  const grouped = {
    basic: filtered.filter(s => s.tier === 'basic'),
    standard: filtered.filter(s => s.tier === 'standard'),
    premium: filtered.filter(s => s.tier === 'premium'),
  };

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      const r = await createService(data);
      setServices(prev => [r.data, ...prev]);
      setModal(null);
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      const r = await updateService(editing.id, data);
      setServices(prev => prev.map(s => s.id === editing.id ? r.data : s));
      setModal(null); setEditing(null);
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    setDeleting(id);
    try {
      await deleteService(id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (e) { alert('Error: ' + e.message); }
    finally { setDeleting(null); }
  };

  const openEdit = (service) => { setEditing(service); setModal('edit'); };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1200px', animation: 'pageIn 350ms ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Service Catalog</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Services</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{services.length} service{services.length !== 1 ? 's' : ''} in catalog</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModal('add'); }}
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
          <Plus size={15} /> Add Service
        </button>
      </div>

      {/* Tier filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[
          { key: 'all', label: 'All Services', count: services.length },
          { key: 'basic', label: 'Basic', count: services.filter(s => s.tier === 'basic').length },
          { key: 'standard', label: 'Standard', count: services.filter(s => s.tier === 'standard').length },
          { key: 'premium', label: 'Premium', count: services.filter(s => s.tier === 'premium').length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setTierFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all var(--transition)',
              border: tierFilter === tab.key ? '1px solid var(--accent-gold)' : '1px solid var(--border)',
              background: tierFilter === tab.key ? 'var(--accent-gold-dim)' : 'var(--bg-card)',
              color: tierFilter === tab.key ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {tab.label}
            <span style={{
              fontSize: '11px', padding: '1px 7px', borderRadius: '99px',
              background: tierFilter === tab.key ? 'rgba(201,168,76,0.25)' : 'var(--bg-surface)',
              color: tierFilter === tab.key ? 'var(--accent-gold)' : 'var(--text-muted)',
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading services...</div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Error: {error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '100px 40px', textAlign: 'center' }}>
          <Briefcase size={40} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
          <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>No services in this tier</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add your first service to build your catalog</div>
        </div>
      ) : tierFilter === 'all' ? (
        // Grouped by tier
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(grouped).map(([tier, items]) => {
            if (items.length === 0) return null;
            const tc = TIER_CONFIG[tier];
            return (
              <div key={tier}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ height: '1px', width: '20px', background: tc.accent, opacity: 0.6 }} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: tc.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{tc.label} Tier</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{items.length} service{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {items.map(s => (
                    <ServiceCard key={s.id} service={s} onEdit={openEdit} onDelete={handleDelete} deleting={deleting === s.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(s => (
            <ServiceCard key={s.id} service={s} onEdit={openEdit} onDelete={handleDelete} deleting={deleting === s.id} />
          ))}
        </div>
      )}

      {modal === 'add' && (
        <Modal title="Add Service" onClose={() => setModal(null)} width="580px">
          <ServiceForm onSubmit={handleAdd} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal === 'edit' && editing && (
        <Modal title="Edit Service" onClose={() => { setModal(null); setEditing(null); }} width="580px">
          <ServiceForm initial={editing} onSubmit={handleEdit} onCancel={() => { setModal(null); setEditing(null); }} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
