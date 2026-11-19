import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [venueId, setVenueId] = useState('');
  
  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'Admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await API.get('/events');
      setEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events.');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/events', { 
        title, 
        date, 
        venue_id: venueId ? parseInt(venueId) : null 
      });
      setTitle('');
      setDate('');
      setVenueId('');
      setSuccess('Event created successfully!');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/users', {
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setSuccess(`User '${newUsername}' created successfully!`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleDownload = async (endpoint, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://${window.location.hostname}:5000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
        });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError('Failed to download report file.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Admin Dashboard ({username})</h2>
        <div>
          <Link to="/checkin" style={{ marginRight: '1rem', textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
            Go to Check-In Portal
          </Link>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

      {/* Create User Form */}
      <div style={{ background: '#e9ecef', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h3>Create New User Account</h3>
        <form onSubmit={handleCreateUser}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input 
              type="text" 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input 
              type="password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Role</label>
            <select 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="user">User (Check-in Staff)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create User
          </button>
        </form>
      </div>

      {/* Create Event Form */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h3>Create New Event</h3>
        <form onSubmit={handleCreateEvent}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Event Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venue ID (Optional)</label>
            <input 
              type="number" 
              value={venueId} 
              onChange={(e) => setVenueId(e.target.value)} 
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create Event
          </button>
        </form>
      </div>

      {/* Reports Section */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h3>System Reports & Analytics</h3>
        <p style={{ marginBottom: '1rem', color: '#666' }}>Download administrative logs and attendance summaries.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => handleDownload('/api/reports/csv', 'event_report.csv')}
            style={{ padding: '0.75rem 1.25rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Download Daily CSV Report
          </button>
          <button 
            onClick={() => handleDownload('/api/reports/pdf', 'monthly_summary.pdf')}
            style={{ padding: '0.75rem 1.25rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Download Monthly PDF Summary
          </button>
        </div>
      </div>

      {/* Existing Events List */}
      <h3>Existing Events</h3>
      {events.length === 0 ? (
        <p>No events found in the database.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((ev) => (
            <li key={ev.id} style={{ padding: '1rem', border: '1px solid #ddd', marginBottom: '0.5rem', borderRadius: '4px', background: '#fff' }}>
              <strong>{ev.title}</strong> — Date: {ev.date} {ev.venue_name ? `(Venue: ${ev.venue_name})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}