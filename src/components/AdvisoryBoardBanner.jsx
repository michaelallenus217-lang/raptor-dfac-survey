import React from 'react';

const AdvisoryBoardBanner = ({ onInfoClick }) => {
  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.icon}>📋</div>
        <div style={styles.text}>
          <h3 style={styles.title}>Quarterly Enlisted Advisory Board</h3>
          <p style={styles.date}>Next Meeting: 09 March 2026 at 1500</p>
          <p style={styles.location}>Location: Raptor DFAC</p>
        </div>
        <button 
          onClick={onInfoClick}
          style={styles.infoButton}
          type="button"
        >
          ℹ️
        </button>
      </div>
    </div>
  );
};

const styles = {
  banner: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    maxWidth: '600px',
    margin: '0 auto 24px auto'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '32px',
    flexShrink: 0
  },
  text: {
    flex: 1
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#92400e'
  },
  date: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#78350f',
    fontWeight: '600'
  },
  location: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#78350f'
  },
  infoButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '18px',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

export default AdvisoryBoardBanner;
