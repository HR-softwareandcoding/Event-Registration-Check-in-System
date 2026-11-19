import ChangePasswordForm from '../components/ChangePasswordForm';
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function AdminDashboard() {
  const [venues, setVenues] = useState([]);
  const [newVenueId, setNewVenueId] = useState('');
  const [newVenueName, setNewVenueName] = useState('');

  const [events, setEvents] = useState([]);
  const [overview, setOverview] = useState([]);
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
    fetchOverview();
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await API.get('/venues');
      setVenues(response.data);
    } catch (err) {
      setError('Failed to fetch venues.');
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await API.post('/venues', {
        id: parseInt(newVenueId, 10),
        name: newVenueName.trim()
      });
      setNewVenueId('');
      setNewVenueName('');
      setSuccess('Venue created successfully!');
      fetchVenues();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create venue');
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await API.get('/events');
      setEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events.');
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await API.get('/admin/overview');
      setOverview(response.data);
    } catch (err) {
      setError('Failed to fetch attendee overview.');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await API.post('/events', {
        title: title.trim(),
        date,
        venue_id: parseInt(venueId, 10)
      });
      setTitle('');
      setDate('');
      setVenueId('');
      setSuccess('Event created successfully!');
      fetchEvents();
      fetchOverview();
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

  // Group overview rows by event_id
  const groupedEvents = overview.reduce((acc, row) => {
    if (!acc[row.event_id]) {
      acc[row.event_id] = {
        id: row.event_id,
        title: row.event_title,
        date: row.event_date,
        venue_id: row.venue_id,
        venue_name: row.venue_name,
        attendees: []
      };
    }
    if (row.registration_id) {
      acc[row.event_id].attendees.push({
        id: row.registration_id,
        email: row.guest_email,
        checked_in: row.checked_in
      });
    }
    return acc;
  }, {});

  const eventList = Object.values(groupedEvents);

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
      <div style={{ background: '#e9ecef', color: '#333', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
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

      {/* Create Venue Form */}
      <div style={{ background: '#f8f9fa', color: '#333', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h3>Create Venue</h3>
        <form onSubmit={handleCreateVenue}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venue ID</label>
            <input
              type="number"
              value={newVenueId}
              onChange={(e) => setNewVenueId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Venue Name</label>
            <input
              type="text"
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create Venue
          </button>
        </form>
      </div>

      {/* Create Event Form */}
      <div style={{ background: '#f8f9fa', color: '#333', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
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
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Venue</label>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="">-- Select a Venue --</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} - {v.name}
                </option>
              ))}
            </select>
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
          <button type="submit" style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Create Event
          </button>
        </form>
      </div>

      {/* Reports Section */}
      <div style={{ background: '#fff', color: '#333', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
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

      <ChangePasswordForm />

      {/* Full Events & Attendees Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Events & Attendees Overview</h3>
        <button
          onClick={fetchOverview}
          style={{ padding: '0.4rem 0.9rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh List
        </button>
      </div>

      {eventList.length === 0 ? (
        <p>No events found in the database.</p>
      ) : (
        eventList.map((ev) => (
          <div key={ev.id} style={{ background: '#fff', color: '#333', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ddd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>{ev.title}</strong>
                <span style={{ marginLeft: '0.75rem', color: '#666' }}>
                  Date: {ev.date} | Venue: {ev.venue_name ? `${ev.venue_name} (ID: ${ev.venue_id})` : `ID ${ev.venue_id}`}
                </span>
              </div>
              <span style={{ background: '#e9ecef', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {ev.attendees.filter((a) => a.checked_in === 1).length} / {ev.attendees.length} Checked In
              </span>
            </div>

            {ev.attendees.length === 0 ? (
              <p style={{ color: '#666', margin: 0 }}>No attendees registered for this event yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                  <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>Check-In ID</th>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>Attendee Email</th>
                    <th style={{ padding: '0.6rem', borderBottom: '1px solid #ddd' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.attendees.map((att) => (
                    <tr key={att.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.6rem' }}><code>{att.id}</code></td>
                      <td style={{ padding: '0.6rem' }}>{att.email}</td>
                      <td style={{ padding: '0.6rem' }}>
                        {att.checked_in === 1 ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>Checked In</span>
                        ) : (
                          <span style={{ color: '#dc3545' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))
      )}
    </div>
  );
}