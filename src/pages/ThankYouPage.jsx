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
      'DTSTART:20260309T220000Z',
      'DTEND:20260309T230000Z',
      'SUMMARY:Quarterly Enlisted Advisory Board',
      'DESCRIPTION:Enlisted Advisory Board meeting for the Raptors Nest DFAC.',
      'LOCATION:Raptors Nest DFAC',
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
        <h1 style={styles.title}>Thank You!</h1>
        <p style={styles.message}>
          Your feedback helps us serve you better. We appreciate your service.
        </p>

        <div style={styles.advisorySection}>
          <h2 style={styles.advisoryTitle}>Join the Advisory Board</h2>
          <p style={styles.advisoryText}>
            Make your voice heard at the next Quarterly Enlisted Advisory Board meeting.
          </p>
          <div style={styles.meetingDetails}>
            <p style={styles.detail}><strong>Date:</strong> 09 March 2026</p>
            <p style={styles.detail}><strong>Time:</strong> 1500 (3:00 PM)</p>
            <p style={styles.detail}><strong>Location:</strong> Raptors Nest DFAC</p>
          </div>
          <button onClick={downloadCalendarEvent} style={styles.calendarButton}>
            📅 Add to Calendar
          </button>
        </div>

        <button onClick={() => navigate('/')} style={styles.newSurveyBtn}>
          Submit Another Response
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    backgroundColor: '#2d3142',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center'
  },
  checkmark: {
    fontSize: '64px',
    color: '#4a7c59',
    marginBottom: '16px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#e8b931',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#a0a0b0',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  advisorySection: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e8b931'
  },
  advisoryTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#e8b931',
    marginBottom: '8px'
  },
  advisoryText: {
    fontSize: '14px',
    color: '#a0a0b0',
    marginBottom: '16px'
  },
  meetingDetails: {
    textAlign: 'left',
    marginBottom: '16px'
  },
  detail: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#ffffff'
  },
  calendarButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e8b931',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  newSurveyBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #3d3d5c',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer'
  }
};

export default ThankYouPage;
