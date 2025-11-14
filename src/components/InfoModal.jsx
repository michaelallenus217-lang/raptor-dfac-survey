import React from 'react';

const InfoModal = ({ onClose }) => {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Enlisted Advisory Board</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>
        
        <div style={styles.content}>
          <p style={styles.paragraph}>
            <strong>Reference:</strong> AR 30-22 (Army Food Program)
          </p>
          
          <p style={styles.paragraph}>
            The Enlisted Advisory Board provides a direct channel for enlisted servicemembers 
            to communicate concerns, suggestions, and feedback regarding dining facility operations. 
            This quarterly meeting ensures that soldier voices are heard in decisions affecting 
            meal quality, service, and facility improvements.
          </p>
          
          <div style={styles.detailsBox}>
            <p style={styles.detail}><strong>Next Meeting:</strong> 09 March 2026</p>
            <p style={styles.detail}><strong>Time:</strong> 1500 (3:00 PM)</p>
            <p style={styles.detail}><strong>Location:</strong> 1-2 SBCT Raptor DFAC</p>
          </div>
          
          <p style={styles.paragraph}>
            <strong>Who Should Attend:</strong> All enlisted servicemembers who eat at the 
            Raptor DFAC are encouraged to participate. Your input directly impacts the quality 
            of food service provided to the brigade.
          </p>
          
          <p style={styles.paragraph}>
            <strong>What to Expect:</strong> Open discussion format covering food quality, 
            menu options, service standards, facility conditions, and upcoming changes. 
            Bring your ideas and concerns.
          </p>
        </div>
        
        <button onClick={onClose} style={styles.okButton}>
          Got It
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a472a'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '32px',
    height: '32px'
  },
  content: {
    padding: '20px'
  },
  paragraph: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151'
  },
  detailsBox: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderRadius: '4px',
    marginBottom: '16px'
  },
  detail: {
    margin: '8px 0',
    fontSize: '14px',
    color: '#1f2937'
  },
  okButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a472a',
    color: 'white',
    border: 'none',
    borderRadius: '0 0 8px 8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default InfoModal;
