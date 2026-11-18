import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';

export default function CheckInPortal() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  
  // Registration State
  const [regEmail, setRegEmail] = useState('');
  const [generatedId, setGeneratedId] = useState('');

  // Guest List & Verification State
  const [guests, setGuests] = useState([]);
  const [inputIds, setInputIds] = useState({}); // Stores typed ID per guest email
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchGuests(selectedEventId);
    } else {
      setGuests([]);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const response = await API.get('/events');
      setEvents(response.data);
    } catch (err) {
      setError('Failed to fetch events.');
    }
  };

  const fetchGuests = async (eventId) => {
    try {
      const response = await API.get(`/events/${eventId}/guests`);
      setGuests(response.data);
    } catch (err) {
      setError('Failed to fetch guest list.');
    }
  };

  const handleRegisterGuest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setGeneratedId('');

    try {
      const response = await API.post(`/events/${selectedEventId}/register`, { email: regEmail });
      setGeneratedId(response.data.uniqueId);
      setSuccess(`Guest registered successfully! Unique ID: ${response.data.uniqueId}`);
      setRegEmail('');
      fetchGuests(selectedEventId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register guest.');
    }
  };

  const handleVerifyCheckIn = async (email) => {
    setError('');
    setSuccess('');
    const typedId = inputIds[email] || '';

    try {
      await API.post(`/events/${selectedEventId}/verify-checkin`, {
        email,
        uniqueId: typedId
      });
      setSuccess(`Guest ${email} verified and checked in!`);
      fetchGuests(selectedEventId);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Guest Check-in & Registration Portal ({username})</h2>
        <div>
          {role === 'admin' && (
            <Link to="/admin" style={{ marginRight: '1rem', textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
              Back to Admin Dashboard
            </Link>
          )}
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '1rem' }}>{success}</p>}

      {/* Select Event Section */}
      <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h3>1. Select Active Event</h3>
        <select 
          value={selectedEventId} 
          onChange={(e) => setSelectedEventId(e.target.value)} 
          style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">-- Choose an Event --</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({ev.date})
            </option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <>
          {/* Register Guest Section */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ddd' }}>
            <h3>2. Register Guest for Event</h3>
            <form onSubmit={handleRegisterGuest}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="email" 
                  value={regEmail} 
                  onChange={(e) => setRegEmail(e.target.value)} 
                  placeholder="guest@example.com" 
                  required 
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Register & Generate ID
                </button>
              </div>
            </form>
            {generatedId && (
              <p style={{ marginTop: '1rem', background: '#e2f0d9', padding: '0.75rem', borderRadius: '4px' }}>
                <strong>Generated Unique ID:</strong> <code>{generatedId}</code> (Copy this to email manually to the guest)
              </p>
            )}
          </div>

          {/* Guest Verification & Check-in List */}
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3>3. Guest Verification & Check-in List</h3>
            {guests.length === 0 ? (
              <p>No guests registered for this event yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                <thead>
                  <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Guest Email</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Status</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Enter Unique ID to Verify</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g) => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{g.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {g.checked_in === 1 ? (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>☑ Checked In</span>
                        ) : (
                          <span style={{ color: '#dc3545' }}>☐ Pending</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {g.checked_in === 0 ? (
                          <input 
                            type="text" 
                            placeholder="Enter Unique ID" 
                            value={inputIds[g.email] || ''}
                            onChange={(e) => setInputIds({ ...inputIds, [g.email]: e.target.value })}
                            style={{ padding: '0.4rem', width: '180px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        ) : (
                          <em>Verified ({g.id})</em>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {g.checked_in === 0 && (
                          <button 
                            onClick={() => handleVerifyCheckIn(g.email)}
                            style={{ padding: '0.4rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Verify & Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}