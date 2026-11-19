import { useState } from 'react';
import API from '../api';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    try {
      const res = await API.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setStatus({ type: 'success', message: res.data.message });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.error || 'Failed to change password',
      });
    }
  };

  return (
    <div style={{ background: '#f5f5f5', color: '#333', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0 }}>Change Password</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>New Password (min 6 chars)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>
        <button type="submit" style={{ background: '#17a2b8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
          Update Password
        </button>
      </form>
      {status.message && (
        <p style={{ color: status.type === 'error' ? 'red' : 'green', marginTop: '10px' }}>
          {status.message}
        </p>
      )}
    </div>
  );
}