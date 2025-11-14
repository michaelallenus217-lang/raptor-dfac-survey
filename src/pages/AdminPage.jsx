import React, { useState, useEffect } from 'react';
import { getSurveyResponses } from '../config/firebase';

const AdminPage = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // Simple password protection - in production, use proper auth
  const ADMIN_PASSWORD = 'raptor2024';

  useEffect(() => {
    if (authenticated) {
      loadResponses();
    }
  }, [authenticated]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await getSurveyResponses();
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>Admin Access</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={styles.passwordInput}
            />
            <button type="submit" style={styles.loginButton}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading responses...</div>
      </div>
    );
  }

  const calculateAverage = (field) => {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((acc, r) => acc + r[field], 0);
    return (sum / responses.length).toFixed(2);
  };

  const avgCustomerSatisfaction = calculateAverage('customerSatisfaction');
  const avgFoodQuality = calculateAverage('foodQuality');
  const avgCleanliness = calculateAverage('cleanliness');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Survey Analytics Dashboard</h1>
        <button onClick={loadResponses} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Responses</div>
          <div style={styles.statValue}>{responses.length}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Customer Satisfaction</div>
          <div style={styles.statValue}>
            {avgCustomerSatisfaction} / 5
            <span style={styles.stars}>{'★'.repeat(Math.round(avgCustomerSatisfaction))}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Food Quality</div>
          <div style={styles.statValue}>
            {avgFoodQuality} / 5
            <span style={styles.stars}>{'★'.repeat(Math.round(avgFoodQuality))}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Avg Cleanliness</div>
          <div style={styles.statValue}>
            {avgCleanliness} / 5
            <span style={styles.stars}>{'★'.repeat(Math.round(avgCleanliness))}</span>
          </div>
        </div>
      </div>

      <div style={styles.responsesSection}>
        <h2 style={styles.sectionTitle}>Individual Responses</h2>
        {responses.length === 0 ? (
          <p style={styles.noData}>No responses yet.</p>
        ) : (
          <div style={styles.responsesList}>
            {responses.map((response, index) => (
              <div key={response.id} style={styles.responseCard}>
                <div style={styles.responseHeader}>
                  <span style={styles.responseNumber}>Response #{responses.length - index}</span>
                  <span style={styles.timestamp}>
                    {new Date(response.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div style={styles.ratingsRow}>
                  <div style={styles.ratingItem}>
                    <span style={styles.ratingLabel}>Satisfaction:</span>
                    <span style={styles.ratingValue}>
                      {'★'.repeat(response.customerSatisfaction)}
                      {'☆'.repeat(5 - response.customerSatisfaction)}
                    </span>
                  </div>
                  <div style={styles.ratingItem}>
                    <span style={styles.ratingLabel}>Food:</span>
                    <span style={styles.ratingValue}>
                      {'★'.repeat(response.foodQuality)}
                      {'☆'.repeat(5 - response.foodQuality)}
                    </span>
                  </div>
                  <div style={styles.ratingItem}>
                    <span style={styles.ratingLabel}>Cleanliness:</span>
                    <span style={styles.ratingValue}>
                      {'★'.repeat(response.cleanliness)}
                      {'☆'.repeat(5 - response.cleanliness)}
                    </span>
                  </div>
                </div>

                {response.improvements && (
                  <div style={styles.feedbackSection}>
                    <strong style={styles.feedbackLabel}>Improvements:</strong>
                    <p style={styles.feedbackText}>{response.improvements}</p>
                  </div>
                )}

                {response.likes && (
                  <div style={styles.feedbackSection}>
                    <strong style={styles.feedbackLabel}>What they like:</strong>
                    <p style={styles.feedbackText}>{response.likes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginContainer: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  loginTitle: {
    marginBottom: '24px',
    fontSize: '24px',
    textAlign: 'center',
    color: '#1a472a'
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1a472a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    backgroundColor: '#1a472a',
    color: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  refreshButton: {
    backgroundColor: 'white',
    color: '#1a472a',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    padding: '40px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a472a'
  },
  stars: {
    display: 'block',
    fontSize: '18px',
    color: '#fbbf24',
    marginTop: '4px'
  },
  responsesSection: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '20px',
    color: '#1a472a'
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    padding: '20px'
  },
  responsesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  responseCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: '#fafafa'
  },
  responseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  },
  responseNumber: {
    fontWeight: 'bold',
    color: '#1a472a'
  },
  timestamp: {
    fontSize: '12px',
    color: '#666'
  },
  ratingsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  ratingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  ratingLabel: {
    fontSize: '12px',
    color: '#666'
  },
  ratingValue: {
    fontSize: '16px',
    color: '#fbbf24'
  },
  feedbackSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb'
  },
  feedbackLabel: {
    fontSize: '14px',
    color: '#1a472a',
    display: 'block',
    marginBottom: '4px'
  },
  feedbackText: {
    fontSize: '14px',
    color: '#374151',
    margin: '0',
    lineHeight: '1.5'
  }
};

export default AdminPage;
