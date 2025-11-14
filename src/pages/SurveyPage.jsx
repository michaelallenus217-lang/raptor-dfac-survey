import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';
import AdvisoryBoardBanner from '../components/AdvisoryBoardBanner';
import InfoModal from '../components/InfoModal';
import { submitSurvey } from '../config/firebase';

const SurveyPage = () => {
  const navigate = useNavigate();
  const [showInfo, setShowInfo] = useState(false);
  const [ratings, setRatings] = useState({
    customerSatisfaction: 0,
    foodQuality: 0,
    cleanliness: 0
  });
  const [improvements, setImprovements] = useState('');
  const [likes, setLikes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (ratings.customerSatisfaction === 0 || ratings.foodQuality === 0 || ratings.cleanliness === 0) {
      alert('Please provide all star ratings before submitting.');
      return;
    }

    setSubmitting(true);
    
    try {
      await submitSurvey({
        ...ratings,
        improvements: improvements.trim(),
        likes: likes.trim(),
        timestamp: new Date().toISOString()
      });
      
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>1-2 SBCT Raptor DFAC</h1>
        <p style={styles.subtitle}>Customer Feedback Survey</p>
      </div>

      <AdvisoryBoardBanner onInfoClick={() => setShowInfo(true)} />

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.ratingSection}>
          <label style={styles.label}>Customer Satisfaction</label>
          <StarRating 
            value={ratings.customerSatisfaction}
            onChange={(val) => setRatings({...ratings, customerSatisfaction: val})}
          />
        </div>

        <div style={styles.ratingSection}>
          <label style={styles.label}>Food Quality</label>
          <StarRating 
            value={ratings.foodQuality}
            onChange={(val) => setRatings({...ratings, foodQuality: val})}
          />
        </div>

        <div style={styles.ratingSection}>
          <label style={styles.label}>Cleanliness</label>
          <StarRating 
            value={ratings.cleanliness}
            onChange={(val) => setRatings({...ratings, cleanliness: val})}
          />
        </div>

        <div style={styles.textSection}>
          <label style={styles.label}>What improvements would you like to see?</label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            style={styles.textarea}
            placeholder="Your suggestions..."
            rows="4"
          />
        </div>

        <div style={styles.textSection}>
          <label style={styles.label}>What do you like?</label>
          <textarea
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
            style={styles.textarea}
            placeholder="What we're doing well..."
            rows="4"
          />
        </div>

        <button 
          type="submit" 
          style={styles.submitButton}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
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
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#1a472a',
    color: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  subtitle: {
    margin: 0,
    fontSize: '16px',
    opacity: 0.9
  },
  form: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  ratingSection: {
    marginBottom: '24px'
  },
  textSection: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#1a472a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default SurveyPage;
