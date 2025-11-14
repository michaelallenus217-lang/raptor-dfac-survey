import React, { useState } from 'react';

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          style={styles.starButton}
        >
          <span style={{
            ...styles.star,
            color: star <= (hover || value) ? '#fbbf24' : '#d1d5db'
          }}>
            ★
          </span>
        </button>
      ))}
      <span style={styles.ratingText}>
        {value > 0 ? `${value} / 5` : 'Tap to rate'}
      </span>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  starButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    transition: 'transform 0.1s'
  },
  star: {
    fontSize: '32px',
    transition: 'color 0.1s'
  },
  ratingText: {
    marginLeft: '12px',
    fontSize: '14px',
    color: '#666',
    fontWeight: '500'
  }
};

export default StarRating;
