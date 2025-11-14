import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouPage = () => {
  const navigate = useNavigate();

  const downloadCalendarEvent = () => {
    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//1-2 SBCT//Raptor DFAC//EN',
      'BEGIN:VEVENT',
      'UID:advisory-board-2026-03-09@raptor-dfac.mil',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART:20260309T220000Z', // 1500 PST = 2200 UTC
      'DTEND:20260309T230000Z',   // 1 hour duration
      'SUMMARY:Quarterly Enlisted Advisory Board',
      'DESCRIPTION:Enlisted Advisory Board meeting for the 1-2 SBCT Raptor DFAC. All enlisted servicemembers who eat at the dining facility are encouraged to participate. Bring your feedback and suggestions.',
      'LOCATION:1-2 SBCT Raptor DFAC',
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([event], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'advisory-board-2026-03-09.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.title}>Thank You for Your Feedback!</h1>
        <p style={styles.message}>
          Your input helps us serve you better. We appreciate your service and 
          commitment to improving the Raptor DFAC.
        </p>

        <div style={styles.advisorySection}>
          <h2 style={styles.advisoryTitle}>Join the Advisory Board</h2>
          <p style={styles.advisoryText}>
            Make your voice heard at the next Quarterly Enlisted Advisory Board meeting.
          </p>
          <div style={styles.meetingDetails}>
            <p style={styles.detail}><strong>Date:</strong> 09 March 2026</p>
            <p style={styles.detail}><strong>Time:</strong> 1500 (3:00 PM)</p>
            <p style={styles.detail}><strong>Location:</strong> Raptor DFAC</p>
          </div>
          <button onClick={downloadCalendarEvent} style={styles.calendarButton}>
            📅 Add to Calendar
          </button>
        </div>


      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  checkmark: {
    fontSize: '64px',
    color: '#10b981',
    marginBottom: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a472a',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  advisorySection: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px'
  },
  advisoryTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: '8px'
  },
  advisoryText: {
    fontSize: '14px',
    color: '#78350f',
    marginBottom: '16px'
  },
  meetingDetails: {
    textAlign: 'left',
    marginBottom: '16px'
  },
  detail: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#78350f'
  },
  calendarButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px'
  }
};

export default ThankYouPage;
