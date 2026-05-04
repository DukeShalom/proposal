import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients, createClient, updateClient, deleteClient } from '../api.js';
import Modal from '../components/Modal.jsx';
import ClientForm from '../components/ClientForm.jsx';
import { UserPlus, Edit2, Trash2, FileText, Search, Users } from 'lucide-react';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    getClients()
      .then(r => setClients(r.data || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  const handleAdd = async (data) => {
    setSaving(true);
    try {
      const r = await createClient(data);
      setClients(prev => [r.data, ...prev]);
      setModal(null);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data) => {
    setSaving(true);
    try {
      const r = await updateClient(editing.id, data);
      setClients(prev => prev.map(c => c.id === editing.id ? r.data : c));
      setModal(null);
      setEditing(null);
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ padding: '36px 40px', maxWidth: '1100px', animation: 'pageIn 350ms ease both' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '500' }}>Client Management</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>Clients</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModal('add'); }}
          style={{
            padding: '11px 20px',
            background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: '#0a0e1a',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <UserPlus size={15} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients by name, company, or email..."
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'border-color var(--transition)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-gold)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading clients...</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center' }}>
            <Users size={40} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
            <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {search ? 'No clients match your search' : 'No clients yet'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {search ? 'Try a different search term' : 'Add your first client to get started'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                {['Name', 'Company', 'Email', 'Phone', 'Added', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px',
                    textAlign: h === 'Actions' ? 'right' : 'left',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((client, i) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background var(--transition)',
                    opacity: deleting === client.id ? 0.4 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-light) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: '#0a0e1a', flexShrink: 0,
                      }}>
                        {(client.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{client.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{client.company || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <a href={`mailto:${client.email}`} style={{ color: 'var(--info)', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      {client.email}
                    </a>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{client.phone || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{formatDate(client.createdAt)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => navigate(`/documents/new?clientId=${client.id}`)}
                        title="New Document"
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontFamily: 'var(--font-body)', transition: 'all var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = 'var(--accent-gold)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <FileText size={12} /> New Doc
                      </button>
                      <button
                        onClick={() => { setEditing(client); setModal('edit'); }}
                        title="Edit"
                        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--info)'; e.currentTarget.style.color = 'var(--info)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        disabled={deleting === client.id}
                        title="Delete"
                        style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition)' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Add New Client" onClose={() => setModal(null)}>
          <ClientForm onSubmit={handleAdd} onCancel={() => setModal(null)} loading={saving} />
        </Modal>
      )}
      {modal === 'edit' && editing && (
        <Modal title="Edit Client" onClose={() => { setModal(null); setEditing(null); }}>
          <ClientForm initial={editing} onSubmit={handleEdit} onCancel={() => { setModal(null); setEditing(null); }} loading={saving} />
        </Modal>
      )}
    </div>
  );
}
