import React, { useState, useEffect, useMemo } from 'react';
import { getSurveyResponses } from '../config/firebase';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';

const AdminPage = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

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

  // Filter responses by time period
  const filteredResponses = useMemo(() => {
    if (timeFilter === 'all') return responses;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return responses.filter(r => {
      const responseDate = new Date(r.timestamp);
      if (timeFilter === 'week') return responseDate >= startOfWeek;
      if (timeFilter === 'month') return responseDate >= startOfMonth;
      return true;
    });
  }, [responses, timeFilter]);

  // Calculate averages
  const calculateAverage = (data, field) => {
    if (data.length === 0) return 0;
    const validData = data.filter(r => r[field] !== undefined && r[field] !== null);
    if (validData.length === 0) return 0;
    const sum = validData.reduce((acc, r) => acc + r[field], 0);
    return (sum / validData.length).toFixed(2);
  };

  // Meal period breakdown
  const mealBreakdown = useMemo(() => {
    const counts = { breakfast: 0, lunch: 0, dinner: 0 };
    filteredResponses.forEach(r => {
      if (r.meal && counts.hasOwnProperty(r.meal)) {
        counts[r.meal]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [filteredResponses]);

  // Station popularity
  const stationBreakdown = useMemo(() => {
    const counts = {};
    filteredResponses.forEach(r => {
      if (r.stations && Array.isArray(r.stations)) {
        r.stations.forEach(station => {
          counts[station] = (counts[station] || 0) + 1;
        });
      }
    });
    const labels = {
      breakfast: 'Breakfast',
      asian: 'Asian Cuisine',
      southwest: 'Southwest Bowl',
      grill: 'Grill Station',
      pizza: 'Flatbread & Pizza',
      deli: 'Deli & Sandwich'
    };
    return Object.entries(counts)
      .map(([id, value]) => ({ name: labels[id] || id, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredResponses]);

  // Recommend percentage
  const recommendStats = useMemo(() => {
    const yes = filteredResponses.filter(r => r.recommend === 'yes').length;
    const no = filteredResponses.filter(r => r.recommend === 'no').length;
    const total = yes + no;
    return {
      yes,
      no,
      total,
      percentage: total > 0 ? ((yes / total) * 100).toFixed(0) : 0
    };
  }, [filteredResponses]);

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map((day, index) => {
      const dayResponses = filteredResponses.filter(r => {
        const d = new Date(r.timestamp);
        return d.getDay() === index;
      });
      
      if (dayResponses.length === 0) {
        return { day: day.substring(0, 3), count: 0, avgRating: 0 };
      }
      
      const avgFood = dayResponses.reduce((acc, r) => acc + (r.foodQuality || 0), 0) / dayResponses.length;
      const avgSat = dayResponses.reduce((acc, r) => acc + (r.customerSatisfaction || 0), 0) / dayResponses.length;
      const avgClean = dayResponses.reduce((acc, r) => acc + (r.cleanliness || 0), 0) / dayResponses.length;
      const avgRating = (avgFood + avgSat + avgClean) / 3;
      
      return {
        day: day.substring(0, 3),
        fullDay: day,
        count: dayResponses.length,
        avgRating: parseFloat(avgRating.toFixed(2)),
        avgFood: parseFloat(avgFood.toFixed(2)),
        avgSat: parseFloat(avgSat.toFixed(2)),
        avgClean: parseFloat(avgClean.toFixed(2))
      };
    });
  }, [filteredResponses]);

  // Best and worst days
  const { bestDays, worstDays } = useMemo(() => {
    const daysWithData = dayOfWeekData.filter(d => d.count > 0);
    const sorted = [...daysWithData].sort((a, b) => b.avgRating - a.avgRating);
    return {
      bestDays: sorted.slice(0, 3),
      worstDays: sorted.slice(-3).reverse()
    };
  }, [dayOfWeekData]);

  // Extract top themes from text feedback
  const extractTopThemes = (data, field) => {
    const texts = data
      .map(r => ({ text: r[field], timestamp: r.timestamp }))
      .filter(t => t.text && t.text.trim().length > 5);
    
    if (texts.length === 0) return [];
    
    const phraseGroups = {};
    
    const ignoreWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i',
      'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so',
      'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
      'if', 'like', 'get', 'got', 'make', 'made', 'need', 'want', 'see',
      'good', 'great', 'nice', 'better', 'best', 'really', 'much', 'always',
      'never', 'sometimes', 'often', 'usually', 'still', 'already', 'yet',
      'think', 'know', 'feel', 'look', 'seem', 'come', 'go', 'take', 'give',
      'everything', 'something', 'anything', 'nothing', 'stuff', 'things', 'thing'
    ]);
    
    const getKeywords = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !ignoreWords.has(w));
    };
    
    const relevantKeywords = new Set([
      'food', 'drinks', 'drink', 'coffee', 'juice', 'water', 'milk', 'soda',
      'breakfast', 'lunch', 'dinner', 'meal', 'menu', 'options', 'variety',
      'chicken', 'beef', 'pork', 'fish', 'meat', 'vegetable', 'vegetables',
      'fruit', 'salad', 'dessert', 'desserts', 'rice', 'pasta', 'pizza',
      'fresh', 'hot', 'cold', 'warm', 'taste', 'tasty', 'flavor', 'delicious',
      'bland', 'dry', 'soggy', 'portion', 'portions', 'serving', 'size',
      'staff', 'workers', 'server', 'service', 'friendly', 'rude', 'slow', 'fast',
      'wait', 'waiting', 'line', 'lines', 'crowded', 'busy',
      'clean', 'dirty', 'cleanliness', 'tables', 'trays', 'utensils',
      'hours', 'time', 'open', 'closed', 'early', 'late',
      'asian', 'grill', 'deli', 'sandwich', 'southwest', 'flatbread'
    ]);
    
    const phrases = [
      'run out', 'runs out', 'running out', 'ran out',
      'not enough', 'too much', 'too little', 'too long',
      'more options', 'more variety', 'better selection',
      'long line', 'long lines', 'long wait',
      'fresh food', 'hot food', 'cold food',
      'friendly staff', 'rude staff', 'helpful staff',
      'good quality', 'bad quality', 'poor quality',
      'tastes good', 'taste bad', 'well done', 'keep up'
    ];
    
    texts.forEach(({ text, timestamp }) => {
      const keywords = getKeywords(text);
      const relevantFound = keywords.filter(k => relevantKeywords.has(k));
      let groupKey = relevantFound[0] || keywords[0] || 'general';
      
      const lowerText = text.toLowerCase();
      for (const phrase of phrases) {
        if (lowerText.includes(phrase)) {
          groupKey = phrase;
          break;
        }
      }
      
      if (!phraseGroups[groupKey]) phraseGroups[groupKey] = [];
      phraseGroups[groupKey].push({ text, timestamp });
    });
    
    return Object.entries(phraseGroups)
      .map(([key, comments]) => ({
        theme: key.charAt(0).toUpperCase() + key.slice(1),
        count: comments.length,
        allComments: comments.map(c => c.text)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topImprovements = useMemo(() => extractTopThemes(filteredResponses, 'improvements'), [filteredResponses]);
  const topSustainments = useMemo(() => extractTopThemes(filteredResponses, 'likes'), [filteredResponses]);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredResponses.forEach(r => {
      const food = r.foodQuality || 0;
      const sat = r.customerSatisfaction || 0;
      const clean = r.cleanliness || 0;
      if (food && sat && clean) {
        const avg = Math.round((food + sat + clean) / 3);
        distribution[avg]++;
      }
    });
    return [
      { name: '1 Star', value: distribution[1], color: '#ef4444' },
      { name: '2 Stars', value: distribution[2], color: '#f97316' },
      { name: '3 Stars', value: distribution[3], color: '#eab308' },
      { name: '4 Stars', value: distribution[4], color: '#84cc16' },
      { name: '5 Stars', value: distribution[5], color: '#22c55e' }
    ].filter(d => d.value > 0);
  }, [filteredResponses]);

  const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
            <button type="submit" style={styles.loginButton}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.container}><div style={styles.loading}>Loading...</div></div>;
  }

  const avgFood = calculateAverage(filteredResponses, 'foodQuality');
  const avgSat = calculateAverage(filteredResponses, 'customerSatisfaction');
  const avgClean = calculateAverage(filteredResponses, 'cleanliness');
  const overallAvg = filteredResponses.length > 0 
    ? ((parseFloat(avgFood) + parseFloat(avgSat) + parseFloat(avgClean)) / 3).toFixed(2) : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Raptors Nest DFAC Analytics</h1>
          <p style={styles.subtitle}>Survey Response Dashboard</p>
        </div>
        <button onClick={loadResponses} style={styles.refreshButton}>🔄 Refresh</button>
      </div>

      {/* Time Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterButtons}>
          {[{ key: 'all', label: 'All Time' }, { key: 'month', label: 'This Month' }, { key: 'week', label: 'This Week' }].map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              style={{ ...styles.filterButton, ...(timeFilter === f.key ? styles.filterButtonActive : {}) }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={styles.periodLabel}>Showing {filteredResponses.length} responses</div>
      </div>

      {/* Tabs */}
      <div style={styles.tabNav}>
        {[{ key: 'overview', label: '📊 Overview' }, { key: 'trends', label: '📈 Trends' }, { key: 'feedback', label: '💬 Feedback' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{ ...styles.tabButton, ...(activeTab === tab.key ? styles.tabButtonActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Responses</div>
              <div style={styles.statValue}>{filteredResponses.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Overall Rating</div>
              <div style={styles.statValue}>{overallAvg} <span style={styles.star}>★</span></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Would Recommend</div>
              <div style={styles.statValue}>{recommendStats.percentage}%</div>
              <div style={styles.statSubtext}>{recommendStats.yes} yes / {recommendStats.no} no</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Food Quality</div>
              <div style={styles.statValue}>{avgFood} <span style={styles.star}>★</span></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Satisfaction</div>
              <div style={styles.statValue}>{avgSat} <span style={styles.star}>★</span></div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Cleanliness</div>
              <div style={styles.statValue}>{avgClean} <span style={styles.star}>★</span></div>
            </div>
          </div>

          {/* Meal & Station Breakdown */}
          <div style={styles.chartsRow}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Responses by Meal</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={mealBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {mealBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Station Popularity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stationBreakdown} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4a7c59" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Best/Worst Days */}
          <div style={styles.daysGrid}>
            <div style={styles.daysCard}>
              <h3 style={styles.daysTitle}>✅ Best Days</h3>
              {bestDays.length === 0 ? <p style={styles.noData}>No data</p> : bestDays.map((d, i) => (
                <div key={d.fullDay} style={styles.dayRow}>
                  <span style={styles.dayRank}>#{i + 1}</span>
                  <span style={styles.dayName}>{d.fullDay}</span>
                  <span style={styles.dayRating}>{d.avgRating.toFixed(1)} ★</span>
                </div>
              ))}
            </div>
            <div style={styles.daysCard}>
              <h3 style={{ ...styles.daysTitle, color: '#dc2626' }}>⚠️ Needs Improvement</h3>
              {worstDays.length === 0 ? <p style={styles.noData}>No data</p> : worstDays.map((d, i) => (
                <div key={d.fullDay} style={styles.dayRow}>
                  <span style={styles.dayRank}>#{i + 1}</span>
                  <span style={styles.dayName}>{d.fullDay}</span>
                  <span style={{ ...styles.dayRating, color: '#dc2626' }}>{d.avgRating.toFixed(1)} ★</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <>
          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Performance by Day of Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgFood" fill="#2563eb" name="Food" />
                <Bar dataKey="avgSat" fill="#16a34a" name="Satisfaction" />
                <Bar dataKey="avgClean" fill="#9333ea" name="Cleanliness" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Response Volume by Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1a472a" name="Responses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={ratingDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {ratingDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <>
          <div style={styles.feedbackSection}>
            <h3 style={styles.sectionTitle}>🔧 Top Improvement Themes</h3>
            {topImprovements.length === 0 ? <p style={styles.noData}>No feedback yet</p> : (
              <div style={styles.themeList}>
                {topImprovements.slice(0, 3).map((item, i) => (
                  <div key={i} style={styles.themeCard}>
                    <div style={styles.themeHeader}>
                      <span style={styles.themeRank}>#{i + 1}</span>
                      <span style={styles.themeName}>{item.theme}</span>
                      <span style={styles.themeCount}>{item.count} mention{item.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={styles.commentsContainer}>
                      {item.allComments?.slice(0, 3).map((c, j) => (
                        <p key={j} style={styles.themeSample}>"{c}"</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.feedbackSection}>
            <h3 style={styles.sectionTitle}>✅ Top Sustainment Themes</h3>
            {topSustainments.length === 0 ? <p style={styles.noData}>No feedback yet</p> : (
              <div style={styles.themeList}>
                {topSustainments.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ ...styles.themeCard, borderLeftColor: '#16a34a' }}>
                    <div style={styles.themeHeader}>
                      <span style={{ ...styles.themeRank, backgroundColor: '#16a34a' }}>#{i + 1}</span>
                      <span style={styles.themeName}>{item.theme}</span>
                      <span style={styles.themeCount}>{item.count} mention{item.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={styles.commentsContainer}>
                      {item.allComments?.slice(0, 3).map((c, j) => (
                        <p key={j} style={styles.themeSample}>"{c}"</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.feedbackSection}>
            <h3 style={styles.sectionTitle}>Recent Responses</h3>
            {filteredResponses.slice(0, 10).map((r, i) => (
              <div key={r.id} style={styles.responseCard}>
                <div style={styles.responseHeader}>
                  <span style={styles.responseNum}>#{filteredResponses.length - i}</span>
                  <span style={styles.responseTime}>{new Date(r.timestamp).toLocaleString()}</span>
                </div>
                <div style={styles.responseMeta}>
                  {r.meal && <span style={styles.tag}>{r.meal}</span>}
                  {r.stations?.map(s => <span key={s} style={styles.tag}>{s}</span>)}
                  {r.recommend && <span style={{ ...styles.tag, backgroundColor: r.recommend === 'yes' ? '#16a34a' : '#dc2626' }}>
                    {r.recommend === 'yes' ? '👍 Recommends' : '👎 No'}
                  </span>}
                </div>
                <div style={styles.responseRatings}>
                  <span>Food: {'★'.repeat(r.foodQuality || 0)}{'☆'.repeat(5 - (r.foodQuality || 0))}</span>
                  <span>Satisfaction: {'★'.repeat(r.customerSatisfaction || 0)}{'☆'.repeat(5 - (r.customerSatisfaction || 0))}</span>
                  <span>Clean: {'★'.repeat(r.cleanliness || 0)}{'☆'.repeat(5 - (r.cleanliness || 0))}</span>
                </div>
                {r.improvements && <p style={styles.responseText}><strong>Improve:</strong> {r.improvements}</p>}
                {r.likes && <p style={styles.responseText}><strong>Likes:</strong> {r.likes}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  loginContainer: { minHeight: '100vh', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginBox: { backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' },
  loginTitle: { marginBottom: '24px', fontSize: '24px', textAlign: 'center', color: '#1a472a' },
  passwordInput: { width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '16px', boxSizing: 'border-box' },
  loginButton: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', color: 'white', backgroundColor: '#1a472a', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#1a472a', color: 'white', padding: '20px', borderRadius: '8px' },
  title: { margin: 0, fontSize: '24px' },
  subtitle: { margin: '4px 0 0', opacity: 0.8, fontSize: '14px' },
  refreshButton: { backgroundColor: 'white', color: '#1a472a', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  loading: { textAlign: 'center', fontSize: '18px', color: '#666', padding: '40px' },
  filterSection: { backgroundColor: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  filterButtons: { display: 'flex', gap: '8px', marginBottom: '8px' },
  filterButton: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  filterButtonActive: { backgroundColor: '#1a472a', color: 'white', borderColor: '#1a472a' },
  periodLabel: { fontSize: '13px', color: '#666' },
  tabNav: { display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'white', padding: '4px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  tabButton: { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#666' },
  tabButtonActive: { backgroundColor: '#1a472a', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statLabel: { fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '500' },
  statValue: { fontSize: '28px', fontWeight: 'bold', color: '#1a472a' },
  statSubtext: { fontSize: '11px', color: '#999', marginTop: '4px' },
  star: { color: '#fbbf24', fontSize: '20px' },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' },
  chartCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  chartTitle: { margin: '0 0 16px', fontSize: '16px', color: '#1a472a' },
  chartSection: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { margin: '0 0 16px', fontSize: '18px', color: '#1a472a' },
  daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' },
  daysCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  daysTitle: { margin: '0 0 16px', fontSize: '16px', color: '#16a34a' },
  dayRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  dayRank: { width: '30px', fontWeight: 'bold', color: '#666' },
  dayName: { flex: 1, fontWeight: '500' },
  dayRating: { color: '#16a34a', fontWeight: 'bold' },
  noData: { textAlign: 'center', color: '#666', padding: '20px' },
  feedbackSection: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  themeList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  themeCard: { padding: '16px', backgroundColor: '#fafafa', borderRadius: '6px', borderLeft: '4px solid #2563eb' },
  themeHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  themeRank: { backgroundColor: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  themeName: { fontWeight: 'bold', fontSize: '16px', flex: 1 },
  themeCount: { fontSize: '12px', color: '#666' },
  commentsContainer: { marginTop: '12px' },
  themeSample: { margin: '0 0 8px', fontSize: '14px', color: '#666', fontStyle: 'italic', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', borderLeft: '2px solid #ddd' },
  responseCard: { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#fafafa', marginBottom: '12px' },
  responseHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  responseNum: { fontWeight: 'bold', color: '#1a472a' },
  responseTime: { fontSize: '12px', color: '#666' },
  responseMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  tag: { padding: '2px 8px', backgroundColor: '#e5e7eb', borderRadius: '4px', fontSize: '11px', color: '#374151' },
  responseRatings: { display: 'flex', gap: '16px', fontSize: '13px', color: '#fbbf24', marginBottom: '8px', flexWrap: 'wrap' },
  responseText: { fontSize: '13px', color: '#374151', margin: '4px 0', lineHeight: '1.4' }
};

export default AdminPage;
