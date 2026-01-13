import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey } from '../config/firebase';

const SurveyPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    meal: '',
    stations: [],
    foodQuality: 0,
    customerSatisfaction: 0,
    cleanliness: 0,
    recommend: '',
    likes: '',
    improvements: '',
    frequency: '',
    mealCard: ''
  });

  const handleRatingClick = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStationToggle = (station) => {
    setFormData(prev => ({
      ...prev,
      stations: prev.stations.includes(station)
        ? prev.stations.filter(s => s !== station)
        : [...prev.stations, station]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.meal) {
      alert('Please select a meal period.');
      return;
    }
    if (formData.stations.length === 0) {
      alert('Please select at least one station.');
      return;
    }
    if (formData.foodQuality === 0 || formData.customerSatisfaction === 0 || formData.cleanliness === 0) {
      alert('Please provide all ratings.');
      return;
    }
    if (!formData.recommend) {
      alert('Please indicate if you would recommend this DFAC.');
      return;
    }

    setSubmitting(true);
    
    try {
      await submitSurvey({
        meal: formData.meal,
        stations: formData.stations,
        foodQuality: formData.foodQuality,
        customerSatisfaction: formData.customerSatisfaction,
        cleanliness: formData.cleanliness,
        recommend: formData.recommend,
        likes: formData.likes.trim(),
        improvements: formData.improvements.trim(),
        frequency: formData.frequency || null,
        mealCard: formData.mealCard || null,
        timestamp: new Date().toISOString()
      });
      
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
      setSubmitting(false);
    }
  };

  const stations = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'asian', label: 'Asian Cuisine' },
    { id: 'southwest', label: 'Southwest Bowl' },
    { id: 'grill', label: 'Grill Station' },
    { id: 'pizza', label: 'Flatbread & Pizza' },
    { id: 'deli', label: 'Deli & Sandwich' }
  ];

  const RatingScale = ({ name, value, onChange }) => (
    <div>
      <div style={styles.ratingScale}>
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            style={{
              ...styles.ratingButton,
              ...(value === num ? styles.ratingButtonActive : {})
            }}
          >
            {num}
          </button>
        ))}
      </div>
      <div style={styles.scaleLabels}>
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.innerContainer}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>RAPTORS NEST DFAC</h1>
          <p style={styles.headerSubtitle}>Customer Feedback Survey</p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Visit Info */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Today's Visit <span style={styles.required}>*</span>
            </div>
            
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>Meal Period</span>
              <div style={styles.btnGroup}>
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, meal }))}
                    style={{
                      ...styles.btn,
                      ...(formData.meal === meal ? styles.btnActive : {})
                    }}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>Which station(s) did you use?</span>
              <div style={styles.btnGroup}>
                {stations.map(station => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => handleStationToggle(station.id)}
                    style={{
                      ...styles.btn,
                      ...(formData.stations.includes(station.id) ? styles.btnActive : {})
                    }}
                  >
                    {station.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Ratings */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Rate Your Experience <span style={styles.required}>*</span>
            </div>
            
            <div style={styles.ratingGroup}>
              <span style={styles.fieldLabel}>Food Quality</span>
              <RatingScale
                name="foodQuality"
                value={formData.foodQuality}
                onChange={(val) => handleRatingClick('foodQuality', val)}
              />
            </div>

            <div style={styles.ratingGroup}>
              <span style={styles.fieldLabel}>Customer Satisfaction</span>
              <RatingScale
                name="customerSatisfaction"
                value={formData.customerSatisfaction}
                onChange={(val) => handleRatingClick('customerSatisfaction', val)}
              />
            </div>

            <div style={styles.ratingGroup}>
              <span style={styles.fieldLabel}>Cleanliness</span>
              <RatingScale
                name="cleanliness"
                value={formData.cleanliness}
                onChange={(val) => handleRatingClick('cleanliness', val)}
              />
            </div>
          </div>

          {/* Section 3: Recommend */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              Recommendation <span style={styles.required}>*</span>
            </div>
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>Would you recommend this DFAC to another Soldier?</span>
              <div style={styles.toggleGroup}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recommend: 'yes' }))}
                  style={{
                    ...styles.toggleBtn,
                    ...(formData.recommend === 'yes' ? styles.btnActive : {})
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, recommend: 'no' }))}
                  style={{
                    ...styles.toggleBtn,
                    ...(formData.recommend === 'no' ? styles.btnActive : {})
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Open Feedback */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Open Feedback</div>
            
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>
                What did you like? <span style={styles.optionalTag}>Optional</span>
              </span>
              <textarea
                style={styles.textInput}
                value={formData.likes}
                onChange={(e) => setFormData(prev => ({ ...prev, likes: e.target.value }))}
                placeholder="Tell us what worked well..."
                rows={3}
              />
            </div>

            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>
                What could be improved? <span style={styles.optionalTag}>Optional</span>
              </span>
              <textarea
                style={styles.textInput}
                value={formData.improvements}
                onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                placeholder="Tell us how we can do better..."
                rows={3}
              />
            </div>
          </div>

          {/* Section 5: Optional Demographics */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              About You <span style={styles.optionalTag}>Optional</span>
            </div>
            
            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>How often do you eat here?</span>
              <div style={styles.btnGroup}>
                {[
                  { id: 'first', label: 'First Time' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'daily', label: 'Daily' }
                ].map(freq => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, frequency: freq.id }))}
                    style={{
                      ...styles.btn,
                      ...(formData.frequency === freq.id ? styles.btnActive : {})
                    }}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <span style={styles.fieldLabel}>Are you a Meal Card holder?</span>
              <div style={styles.toggleGroup}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mealCard: 'yes' }))}
                  style={{
                    ...styles.toggleBtn,
                    ...(formData.mealCard === 'yes' ? styles.btnActive : {})
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, mealCard: 'no' }))}
                  style={{
                    ...styles.toggleBtn,
                    ...(formData.mealCard === 'no' ? styles.btnActive : {})
                  }}
                >
                  No
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT FEEDBACK'}
          </button>

        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  innerContainer: {
    maxWidth: '480px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e8b931'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '4px',
    color: '#ffffff'
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#a0a0b0',
    margin: 0
  },
  section: {
    backgroundColor: '#2d3142',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#e8b931',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px'
  },
  required: {
    color: '#c44536'
  },
  fieldGroup: {
    marginBottom: '16px'
  },
  fieldLabel: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block',
    color: '#ffffff'
  },
  optionalTag: {
    fontSize: '10px',
    color: '#a0a0b0',
    fontWeight: 'normal',
    marginLeft: '6px'
  },
  btnGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  btn: {
    padding: '10px 16px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    border: 'none',
    color: '#ffffff',
    transition: 'all 0.2s'
  },
  btnActive: {
    backgroundColor: '#4a7c59',
    color: '#ffffff'
  },
  toggleGroup: {
    display: 'flex',
    gap: '12px'
  },
  toggleBtn: {
    flex: 1,
    textAlign: 'center',
    padding: '14px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    border: 'none',
    color: '#ffffff',
    transition: 'all 0.2s'
  },
  ratingGroup: {
    marginBottom: '16px'
  },
  ratingScale: {
    display: 'flex',
    gap: '8px'
  },
  ratingButton: {
    flex: 1,
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: '#1a1a2e',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    color: '#ffffff',
    transition: 'all 0.2s'
  },
  ratingButtonActive: {
    backgroundColor: '#4a7c59',
    color: '#ffffff'
  },
  scaleLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#a0a0b0',
    marginTop: '4px',
    padding: '0 4px'
  },
  textInput: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1a1a2e',
    border: '1px solid #3d3d5c',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    boxSizing: 'border-box'
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#e8b931',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px'
  }
};

export default SurveyPage;
