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
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'trends', 'feedback'

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
      if (timeFilter === 'week') {
        return responseDate >= startOfWeek;
      } else if (timeFilter === 'month') {
        return responseDate >= startOfMonth;
      }
      return true;
    });
  }, [responses, timeFilter]);

  // Calculate previous period for comparison
  const previousPeriodResponses = useMemo(() => {
    if (timeFilter === 'all') return [];
    
    const now = new Date();
    
    if (timeFilter === 'week') {
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay());
      startOfThisWeek.setHours(0, 0, 0, 0);
      
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      
      return responses.filter(r => {
        const responseDate = new Date(r.timestamp);
        return responseDate >= startOfLastWeek && responseDate < startOfThisWeek;
      });
    } else if (timeFilter === 'month') {
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      return responses.filter(r => {
        const responseDate = new Date(r.timestamp);
        return responseDate >= startOfLastMonth && responseDate < startOfThisMonth;
      });
    }
    return [];
  }, [responses, timeFilter]);

  // Calculate averages
  const calculateAverage = (data, field) => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, r) => acc + r[field], 0);
    return (sum / data.length).toFixed(2);
  };

  // Calculate trend (percentage change)
  const calculateTrend = (current, previous, field) => {
    const currentAvg = parseFloat(calculateAverage(current, field));
    const previousAvg = parseFloat(calculateAverage(previous, field));
    if (previousAvg === 0) return current.length > 0 ? 100 : 0;
    return (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(1);
  };

  // Day of week analysis
  const dayOfWeekData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats = days.map((day, index) => {
      const dayResponses = filteredResponses.filter(r => {
        const d = new Date(r.timestamp);
        return d.getDay() === index;
      });
      
      if (dayResponses.length === 0) {
        return { day: day.substring(0, 3), count: 0, avgRating: 0, avgSatisfaction: 0 };
      }
      
      const avgSatisfaction = dayResponses.reduce((acc, r) => acc + r.customerSatisfaction, 0) / dayResponses.length;
      const avgFood = dayResponses.reduce((acc, r) => acc + r.foodQuality, 0) / dayResponses.length;
      const avgClean = dayResponses.reduce((acc, r) => acc + r.cleanliness, 0) / dayResponses.length;
      const avgRating = (avgSatisfaction + avgFood + avgClean) / 3;
      
      return {
        day: day.substring(0, 3),
        fullDay: day,
        count: dayResponses.length,
        avgRating: parseFloat(avgRating.toFixed(2)),
        avgSatisfaction: parseFloat(avgSatisfaction.toFixed(2)),
        avgFood: parseFloat(avgFood.toFixed(2)),
        avgClean: parseFloat(avgClean.toFixed(2))
      };
    });
    
    return dayStats;
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

  // Responses over time (last 14 days)
  const trendData = useMemo(() => {
    const last14Days = [];
    const now = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayResponses = responses.filter(r => {
        const rDate = new Date(r.timestamp);
        return rDate >= date && rDate < nextDate;
      });
      
      const avgRating = dayResponses.length > 0
        ? dayResponses.reduce((acc, r) => acc + (r.customerSatisfaction + r.foodQuality + r.cleanliness) / 3, 0) / dayResponses.length
        : null;
      
      last14Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count: dayResponses.length,
        avgRating: avgRating ? parseFloat(avgRating.toFixed(2)) : null
      });
    }
    
    return last14Days;
  }, [responses]);

  // Extract top themes from text feedback - shows actual meaningful comments
  const extractTopThemes = (data, field) => {
    const texts = data
      .map(r => ({ text: r[field], timestamp: r.timestamp }))
      .filter(t => t.text && t.text.trim().length > 5); // Min 5 chars
    
    if (texts.length === 0) return [];
    
    // Group similar comments by finding common phrases
    const phraseGroups = {};
    
    // Words to completely ignore when matching
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
      'use', 'find', 'tell', 'ask', 'work', 'try', 'leave', 'call', 'keep',
      'let', 'begin', 'show', 'hear', 'play', 'run', 'move', 'live', 'believe',
      'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay',
      'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand',
      'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add',
      'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love',
      'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect',
      'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest',
      'raise', 'pass', 'sell', 'require', 'report', 'decide', 'pull', 'am',
      'been', 'being', 'youre', 'dont', 'doesnt', 'didnt', 'wont', 'cant',
      'couldnt', 'shouldnt', 'wouldnt', 'im', 'ive', 'id', 'ill', 'its',
      'thats', 'theres', 'theyre', 'were', 'weve', 'youve', 'theyd', 'wed',
      'everything', 'something', 'anything', 'nothing', 'everyone', 'someone',
      'anyone', 'nobody', 'stuff', 'things', 'thing', 'way', 'ways', 'lot',
      'lots', 'bit', 'kind', 'sorts', 'type', 'types', 'maybe', 'probably',
      'definitely', 'certainly', 'actually', 'basically', 'especially', 'generally'
    ]);
    
    // Extract meaningful keywords from each comment
    const getKeywords = (text) => {
      return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !ignoreWords.has(w));
    };
    
    // Food/service related keywords to prioritize
    const relevantKeywords = new Set([
      'food', 'drinks', 'drink', 'beverage', 'beverages', 'coffee', 'juice',
      'water', 'milk', 'soda', 'tea', 'breakfast', 'lunch', 'dinner', 'meal',
      'meals', 'menu', 'options', 'variety', 'selection', 'choice', 'choices',
      'chicken', 'beef', 'pork', 'fish', 'meat', 'vegetable', 'vegetables',
      'fruit', 'fruits', 'salad', 'dessert', 'desserts', 'rice', 'pasta',
      'bread', 'eggs', 'bacon', 'sausage', 'pizza', 'burger', 'sandwich',
      'soup', 'sauce', 'seasoning', 'spice', 'spices', 'salt', 'fresh',
      'hot', 'cold', 'warm', 'temperature', 'cooked', 'raw', 'burnt',
      'undercooked', 'overcooked', 'taste', 'tasty', 'flavor', 'delicious',
      'bland', 'dry', 'soggy', 'crispy', 'tender', 'tough', 'portion',
      'portions', 'serving', 'servings', 'size', 'amount', 'quantity',
      'staff', 'workers', 'employees', 'server', 'servers', 'cook', 'cooks',
      'chef', 'service', 'friendly', 'rude', 'slow', 'fast', 'quick',
      'wait', 'waiting', 'line', 'lines', 'queue', 'crowded', 'busy',
      'clean', 'dirty', 'cleanliness', 'sanitary', 'hygiene', 'tables',
      'table', 'trays', 'tray', 'utensils', 'silverware', 'plates', 'cups',
      'napkins', 'floor', 'floors', 'bathroom', 'bathrooms', 'restroom',
      'hours', 'time', 'times', 'open', 'closed', 'early', 'late',
      'morning', 'afternoon', 'evening', 'weekend', 'weekday', 'healthy',
      'unhealthy', 'nutritious', 'calories', 'protein', 'vegetarian', 'vegan',
      'allergen', 'allergy', 'gluten', 'dairy', 'price', 'cost', 'expensive',
      'cheap', 'value', 'worth', 'quality', 'run', 'running', 'out', 'empty',
      'refill', 'refills', 'restock', 'available', 'unavailable', 'limited'
    ]);
    
    // Score each comment by relevance and group similar ones
    texts.forEach(({ text, timestamp }) => {
      const keywords = getKeywords(text);
      const relevantFound = keywords.filter(k => relevantKeywords.has(k));
      
      // Use the most relevant keyword as the group key, or first meaningful word
      let groupKey = relevantFound[0] || keywords[0] || 'general';
      
      // Try to find 2-word phrases for better grouping
      const lowerText = text.toLowerCase();
      const phrases = [
        'run out', 'runs out', 'running out', 'ran out',
        'not enough', 'too much', 'too little', 'too long',
        'more options', 'more variety', 'better selection',
        'long line', 'long lines', 'long wait',
        'fresh food', 'hot food', 'cold food',
        'friendly staff', 'rude staff', 'helpful staff',
        'clean tables', 'dirty tables', 'clean floors',
        'good quality', 'bad quality', 'poor quality',
        'taste good', 'tastes good', 'taste bad', 'tastes bad',
        'well done', 'keep up', 'good job', 'great job'
      ];
      
      for (const phrase of phrases) {
        if (lowerText.includes(phrase)) {
          groupKey = phrase;
          break;
        }
      }
      
      if (!phraseGroups[groupKey]) {
        phraseGroups[groupKey] = [];
      }
      phraseGroups[groupKey].push({ text, timestamp, keywords });
    });
    
    // Sort groups by count and return top themes with example comments
    const sorted = Object.entries(phraseGroups)
      .map(([key, comments]) => ({
        theme: key.charAt(0).toUpperCase() + key.slice(1),
        count: comments.length,
        comments: comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return sorted.map(group => ({
      theme: group.theme,
      count: group.count,
      sample: group.comments[0]?.text || '',
      allComments: group.comments.map(c => c.text)
    }));
  };

  const topImprovements = useMemo(() => extractTopThemes(filteredResponses, 'improvements'), [filteredResponses]);
  const topSustainments = useMemo(() => extractTopThemes(filteredResponses, 'likes'), [filteredResponses]);

  // Rating distribution for pie chart
  const ratingDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredResponses.forEach(r => {
      const avg = Math.round((r.customerSatisfaction + r.foodQuality + r.cleanliness) / 3);
      distribution[avg]++;
    });
    return [
      { name: '1 Star', value: distribution[1], color: '#ef4444' },
      { name: '2 Stars', value: distribution[2], color: '#f97316' },
      { name: '3 Stars', value: distribution[3], color: '#eab308' },
      { name: '4 Stars', value: distribution[4], color: '#84cc16' },
      { name: '5 Stars', value: distribution[5], color: '#22c55e' }
    ].filter(d => d.value > 0);
  }, [filteredResponses]);

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

  const avgSatisfaction = calculateAverage(filteredResponses, 'customerSatisfaction');
  const avgFood = calculateAverage(filteredResponses, 'foodQuality');
  const avgClean = calculateAverage(filteredResponses, 'cleanliness');
  const overallAvg = filteredResponses.length > 0 
    ? ((parseFloat(avgSatisfaction) + parseFloat(avgFood) + parseFloat(avgClean)) / 3).toFixed(2)
    : 0;

  const satisfactionTrend = calculateTrend(filteredResponses, previousPeriodResponses, 'customerSatisfaction');
  const foodTrend = calculateTrend(filteredResponses, previousPeriodResponses, 'foodQuality');
  const cleanTrend = calculateTrend(filteredResponses, previousPeriodResponses, 'cleanliness');
  const countTrend = previousPeriodResponses.length > 0
    ? (((filteredResponses.length - previousPeriodResponses.length) / previousPeriodResponses.length) * 100).toFixed(1)
    : (filteredResponses.length > 0 ? 100 : 0);

  const TrendIndicator = ({ value }) => {
    const num = parseFloat(value);
    if (num === 0) return <span style={styles.trendNeutral}>—</span>;
    return (
      <span style={num > 0 ? styles.trendUp : styles.trendDown}>
        {num > 0 ? '↑' : '↓'} {Math.abs(num)}%
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Raptor DFAC Analytics</h1>
          <p style={styles.headerSubtext}>Survey Response Dashboard</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={loadResponses} style={styles.refreshButton}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Time Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterButtons}>
          {[
            { key: 'all', label: 'All Time' },
            { key: 'month', label: 'This Month' },
            { key: 'week', label: 'This Week' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              style={{
                ...styles.filterButton,
                ...(timeFilter === f.key ? styles.filterButtonActive : {})
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={styles.periodLabel}>
          Showing {filteredResponses.length} responses
          {timeFilter !== 'all' && previousPeriodResponses.length > 0 && 
            ` (vs ${previousPeriodResponses.length} last ${timeFilter === 'week' ? 'week' : 'month'})`
          }
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'trends', label: '📈 Trends' },
          { key: 'feedback', label: '💬 Feedback' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.key ? styles.tabButtonActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total Responses</div>
              <div style={styles.statValue}>{filteredResponses.length}</div>
              {timeFilter !== 'all' && <TrendIndicator value={countTrend} />}
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Overall Rating</div>
              <div style={styles.statValue}>
                {overallAvg} <span style={styles.statStar}>★</span>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Customer Satisfaction</div>
              <div style={styles.statValue}>
                {avgSatisfaction} <span style={styles.statStar}>★</span>
              </div>
              {timeFilter !== 'all' && <TrendIndicator value={satisfactionTrend} />}
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Food Quality</div>
              <div style={styles.statValue}>
                {avgFood} <span style={styles.statStar}>★</span>
              </div>
              {timeFilter !== 'all' && <TrendIndicator value={foodTrend} />}
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Cleanliness</div>
              <div style={styles.statValue}>
                {avgClean} <span style={styles.statStar}>★</span>
              </div>
              {timeFilter !== 'all' && <TrendIndicator value={cleanTrend} />}
            </div>
          </div>

          {/* Best/Worst Days */}
          <div style={styles.daysGrid}>
            <div style={styles.daysCard}>
              <h3 style={styles.daysTitle}>✅ Best Days</h3>
              {bestDays.length === 0 ? (
                <p style={styles.noData}>No data yet</p>
              ) : (
                bestDays.map((day, i) => (
                  <div key={day.fullDay} style={styles.dayRow}>
                    <span style={styles.dayRank}>#{i + 1}</span>
                    <span style={styles.dayName}>{day.fullDay}</span>
                    <span style={styles.dayRating}>
                      {day.avgRating.toFixed(1)} ★
                    </span>
                    <span style={styles.dayCount}>({day.count} responses)</span>
                  </div>
                ))
              )}
            </div>
            <div style={styles.daysCard}>
              <h3 style={{...styles.daysTitle, color: '#dc2626'}}>⚠️ Needs Improvement</h3>
              {worstDays.length === 0 ? (
                <p style={styles.noData}>No data yet</p>
              ) : (
                worstDays.map((day, i) => (
                  <div key={day.fullDay} style={styles.dayRow}>
                    <span style={styles.dayRank}>#{i + 1}</span>
                    <span style={styles.dayName}>{day.fullDay}</span>
                    <span style={{...styles.dayRating, color: '#dc2626'}}>
                      {day.avgRating.toFixed(1)} ★
                    </span>
                    <span style={styles.dayCount}>({day.count} responses)</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rating Distribution */}
          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Rating Distribution</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ratingDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <>
          {/* Response Trend Chart */}
          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Responses Over Time (Last 14 Days)</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="# Responses"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgRating"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Avg Rating"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of Week Chart */}
          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Performance by Day of Week</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgSatisfaction" fill="#2563eb" name="Satisfaction" />
                  <Bar dataKey="avgFood" fill="#16a34a" name="Food Quality" />
                  <Bar dataKey="avgClean" fill="#9333ea" name="Cleanliness" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Count by Day */}
          <div style={styles.chartSection}>
            <h3 style={styles.sectionTitle}>Response Volume by Day</h3>
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1a472a" name="# Responses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <>
          {/* Top Improvements */}
          <div style={styles.feedbackSection}>
            <h3 style={styles.sectionTitle}>🔧 Top Improvement Themes ({filteredResponses.filter(r => r.improvements?.trim()).length} comments)</h3>
            {topImprovements.length === 0 ? (
              <p style={styles.noData}>No improvement feedback yet.</p>
            ) : (
              <div style={styles.themeList}>
                {topImprovements.slice(0, 3).map((item, i) => (
                  <div key={i} style={styles.themeCard}>
                    <div style={styles.themeHeader}>
                      <span style={styles.themeRank}>#{i + 1}</span>
                      <span style={styles.themeName}>{item.theme}</span>
                      <span style={styles.themeCount}>{item.count} mention{item.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={styles.commentsContainer}>
                      {item.allComments?.slice(0, 3).map((comment, j) => (
                        <p key={j} style={styles.themeSample}>"{comment}"</p>
                      ))}
                      {item.allComments?.length > 3 && (
                        <p style={styles.moreComments}>+{item.allComments.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Sustainments */}
          <div style={styles.feedbackSection}>
            <h3 style={styles.sectionTitle}>✅ Top Sustainment Themes ({filteredResponses.filter(r => r.likes?.trim()).length} comments)</h3>
            {topSustainments.length === 0 ? (
              <p style={styles.noData}>No positive feedback yet.</p>
            ) : (
              <div style={styles.themeList}>
                {topSustainments.slice(0, 3).map((item, i) => (
                  <div key={i} style={{...styles.themeCard, borderLeftColor: '#16a34a'}}>
                    <div style={styles.themeHeader}>
                      <span style={{...styles.themeRank, backgroundColor: '#16a34a'}}>#{i + 1}</span>
                      <span style={styles.themeName}>{item.theme}</span>
                      <span style={styles.themeCount}>{item.count} mention{item.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={styles.commentsContainer}>
                      {item.allComments?.slice(0, 3).map((comment, j) => (
                        <p key={j} style={styles.themeSample}>"{comment}"</p>
                      ))}
                      {item.allComments?.length > 3 && (
                        <p style={styles.moreComments}>+{item.allComments.length - 3} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Responses */}
          <div style={styles.responsesSection}>
            <h3 style={styles.sectionTitle}>Recent Feedback</h3>
            {filteredResponses.length === 0 ? (
              <p style={styles.noData}>No responses yet.</p>
            ) : (
              <div style={styles.responsesList}>
                {filteredResponses.slice(0, 10).map((response, index) => (
                  <div key={response.id} style={styles.responseCard}>
                    <div style={styles.responseHeader}>
                      <span style={styles.responseNumber}>
                        Response #{filteredResponses.length - index}
                      </span>
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
                      <div style={styles.feedbackText}>
                        <strong>Improvements:</strong> {response.improvements}
                      </div>
                    )}

                    {response.likes && (
                      <div style={styles.feedbackText}>
                        <strong>Likes:</strong> {response.likes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
    justifyContent: 'center'
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
    marginBottom: '20px',
    backgroundColor: '#1a472a',
    color: 'white',
    padding: '20px',
    borderRadius: '8px'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  headerSubtext: {
    margin: '4px 0 0 0',
    opacity: 0.8,
    fontSize: '14px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  refreshButton: {
    backgroundColor: 'white',
    color: '#1a472a',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    padding: '40px'
  },
  filterSection: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  filterButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  filterButtonActive: {
    backgroundColor: '#1a472a',
    color: 'white',
    borderColor: '#1a472a'
  },
  periodLabel: {
    fontSize: '13px',
    color: '#666'
  },
  tabNav: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '4px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tabButton: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666'
  },
  tabButtonActive: {
    backgroundColor: '#1a472a',
    color: 'white'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a472a'
  },
  statStar: {
    color: '#fbbf24',
    fontSize: '20px'
  },
  trendUp: {
    fontSize: '13px',
    color: '#16a34a',
    fontWeight: '600',
    display: 'block',
    marginTop: '4px'
  },
  trendDown: {
    fontSize: '13px',
    color: '#dc2626',
    fontWeight: '600',
    display: 'block',
    marginTop: '4px'
  },
  trendNeutral: {
    fontSize: '13px',
    color: '#666',
    display: 'block',
    marginTop: '4px'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  daysCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  daysTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#16a34a'
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0'
  },
  dayRank: {
    width: '30px',
    fontWeight: 'bold',
    color: '#666'
  },
  dayName: {
    flex: 1,
    fontWeight: '500'
  },
  dayRating: {
    color: '#16a34a',
    fontWeight: 'bold',
    marginRight: '8px'
  },
  dayCount: {
    fontSize: '12px',
    color: '#999'
  },
  chartSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#1a472a'
  },
  chartContainer: {
    width: '100%',
    minHeight: '200px'
  },
  feedbackSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  themeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  themeCard: {
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '6px',
    borderLeft: '4px solid #2563eb'
  },
  themeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  themeRank: {
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  themeName: {
    fontWeight: 'bold',
    fontSize: '16px',
    flex: 1
  },
  themeCount: {
    fontSize: '12px',
    color: '#666'
  },
  themeSample: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
    padding: '8px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    borderLeft: '2px solid #ddd'
  },
  commentsContainer: {
    marginTop: '12px'
  },
  moreComments: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#999',
    fontStyle: 'italic'
  },
  responsesSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    padding: '20px'
  },
  responsesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
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
  feedbackText: {
    fontSize: '14px',
    color: '#374151',
    marginTop: '8px',
    lineHeight: '1.5'
  }
};

export default AdminPage;
