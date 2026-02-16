import React, { useState, useEffect, useMemo } from 'react';
import { getSurveyResponses } from '../config/firebase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const AdminPage = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [mealFilter, setMealFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedTheme, setExpandedTheme] = useState(null);

  const ADMIN_PASSWORD = 'raptor2024';

  // Inject spinner keyframe
  useEffect(() => {
    if (!document.getElementById('admin-spin-keyframe')) {
      const style = document.createElement('style');
      style.id = 'admin-spin-keyframe';
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (authenticated) loadResponses();
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

  // ── Filters ──────────────────────────────────────────────
  const filteredResponses = useMemo(() => {
    let data = responses;

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let start;
      if (timeFilter === 'today') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeFilter === '7d') {
        start = new Date(now.getTime() - 7 * 86400000);
      } else if (timeFilter === '30d') {
        start = new Date(now.getTime() - 30 * 86400000);
      } else if (timeFilter === '90d') {
        start = new Date(now.getTime() - 90 * 86400000);
      }
      if (start) {
        data = data.filter(r => new Date(r.timestamp) >= start);
      }
    }

    // Meal filter
    if (mealFilter !== 'all') {
      data = data.filter(r => r.meal === mealFilter);
    }

    return data;
  }, [responses, timeFilter, mealFilter]);

  // ── Calculations ─────────────────────────────────────────
  const calcAvg = (data, field) => {
    const valid = data.filter(r => r[field] != null);
    if (!valid.length) return 0;
    return valid.reduce((s, r) => s + r[field], 0) / valid.length;
  };

  const stats = useMemo(() => {
    const n = filteredResponses.length;
    const avgFood = calcAvg(filteredResponses, 'foodQuality');
    const avgSat = calcAvg(filteredResponses, 'customerSatisfaction');
    const avgClean = calcAvg(filteredResponses, 'cleanliness');
    const overall = n ? (avgFood + avgSat + avgClean) / 3 : 0;

    const yesRec = filteredResponses.filter(r => r.recommend === 'yes').length;
    const noRec = filteredResponses.filter(r => r.recommend === 'no').length;
    const totalRec = yesRec + noRec;
    const nps = totalRec ? Math.round(((yesRec - noRec) / totalRec) * 100) : 0;
    const recPct = totalRec ? Math.round((yesRec / totalRec) * 100) : 0;

    return { n, avgFood, avgSat, avgClean, overall, yesRec, noRec, nps, recPct };
  }, [filteredResponses]);

  // ── Meal Breakdown ───────────────────────────────────────
  const mealData = useMemo(() => {
    const counts = { breakfast: 0, lunch: 0, dinner: 0 };
    filteredResponses.forEach(r => {
      if (counts.hasOwnProperty(r.meal)) counts[r.meal]++;
    });
    return Object.entries(counts).map(([k, v]) => ({
      name: k.charAt(0).toUpperCase() + k.slice(1), value: v
    }));
  }, [filteredResponses]);

  // ── Station Breakdown ────────────────────────────────────
  const stationData = useMemo(() => {
    const labels = {
      breakfast: 'Breakfast', asian: 'Asian', southwest: 'Southwest',
      grill: 'Grill', pizza: 'Flatbread', deli: 'Deli'
    };
    const counts = {};
    filteredResponses.forEach(r => {
      if (Array.isArray(r.stations)) {
        r.stations.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
      }
    });
    return Object.entries(counts)
      .map(([k, v]) => ({ name: labels[k] || k, value: v }))
      .sort((a, b) => b.value - a.value);
  }, [filteredResponses]);

  // ── Day of Week ──────────────────────────────────────────
  const dayData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((day, i) => {
      const dr = filteredResponses.filter(r => new Date(r.timestamp).getDay() === i);
      if (!dr.length) return { day, count: 0, avgFood: 0, avgSat: 0, avgClean: 0 };
      return {
        day, count: dr.length,
        avgFood: +(dr.reduce((a, r) => a + (r.foodQuality || 0), 0) / dr.length).toFixed(1),
        avgSat: +(dr.reduce((a, r) => a + (r.customerSatisfaction || 0), 0) / dr.length).toFixed(1),
        avgClean: +(dr.reduce((a, r) => a + (r.cleanliness || 0), 0) / dr.length).toFixed(1),
      };
    });
  }, [filteredResponses]);

  // ── Timeline Trend (grouped by date) ─────────────────────
  const trendData = useMemo(() => {
    const byDate = {};
    filteredResponses.forEach(r => {
      const d = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(r);
    });
    return Object.entries(byDate).map(([date, arr]) => ({
      date,
      count: arr.length,
      food: +(arr.reduce((a, r) => a + (r.foodQuality || 0), 0) / arr.length).toFixed(1),
      satisfaction: +(arr.reduce((a, r) => a + (r.customerSatisfaction || 0), 0) / arr.length).toFixed(1),
      clean: +(arr.reduce((a, r) => a + (r.cleanliness || 0), 0) / arr.length).toFixed(1),
    })).reverse();
  }, [filteredResponses]);

  // ── Rating Distribution ──────────────────────────────────
  const ratingDist = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    filteredResponses.forEach(r => {
      const avg = Math.round(((r.foodQuality || 0) + (r.customerSatisfaction || 0) + (r.cleanliness || 0)) / 3);
      if (avg >= 1 && avg <= 5) dist[avg - 1]++;
    });
    const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    return labels.map((name, i) => ({ name, value: dist[i], color: colors[i] })).filter(d => d.value > 0);
  }, [filteredResponses]);

  // ── Theme Extraction ─────────────────────────────────────
  const extractThemes = (data, field) => {
    const stopWords = new Set([
      'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','as',
      'is','was','are','were','been','be','have','has','had','do','does','did','will','would',
      'could','should','may','might','can','this','that','these','those','i','you','he','she',
      'it','we','they','what','which','who','when','where','why','how','all','each','every',
      'both','few','more','most','other','some','such','no','not','only','same','so','than',
      'too','very','just','also','now','here','there','then','if','like','get','got','make',
      'made','need','want','see','really','much','always','never','sometimes','often','still',
      'already','yet','think','know','feel','look','seem','come','go','take','give','everything',
      'something','anything','nothing','stuff','things','thing','good','great','nice','better','best'
    ]);
    const foodWords = new Set([
      'food','drinks','drink','coffee','juice','water','milk','soda','breakfast','lunch','dinner',
      'meal','menu','options','variety','chicken','beef','pork','fish','meat','vegetable','vegetables',
      'fruit','salad','dessert','rice','pasta','pizza','fresh','hot','cold','warm','taste','tasty',
      'flavor','delicious','bland','dry','soggy','portion','portions','serving','size','staff',
      'workers','server','service','friendly','rude','slow','fast','wait','waiting','line','lines',
      'crowded','busy','clean','dirty','cleanliness','tables','trays','utensils','hours','time',
      'open','closed','early','late','asian','grill','deli','sandwich','southwest','flatbread'
    ]);

    const texts = data.map(r => ({ text: r[field], ts: r.timestamp }))
      .filter(t => t.text && t.text.trim().length > 0);
    if (!texts.length) return [];

    const groups = {};
    texts.forEach(({ text, ts }) => {
      const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w));
      const relevant = words.filter(w => foodWords.has(w));
      const key = relevant.length ? relevant[0] : (words[0] || 'general');
      if (!groups[key]) groups[key] = [];
      groups[key].push({ text, ts });
    });

    return Object.entries(groups)
      .map(([theme, comments]) => ({
        theme: theme.charAt(0).toUpperCase() + theme.slice(1),
        count: comments.length,
        comments: comments.map(c => c.text)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const topImprovements = useMemo(() => extractThemes(filteredResponses, 'improvements'), [filteredResponses]);
  const topLikes = useMemo(() => extractThemes(filteredResponses, 'likes'), [filteredResponses]);

  // ── CSV Export ───────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      'Timestamp', 'Meal', 'Stations', 'Food Quality', 'Customer Satisfaction',
      'Cleanliness', 'Recommend', 'Likes', 'Improvements', 'Frequency', 'Meal Card'
    ];
    const rows = filteredResponses.map(r => [
      r.timestamp,
      r.meal || '',
      Array.isArray(r.stations) ? r.stations.join('; ') : '',
      r.foodQuality || '',
      r.customerSatisfaction || '',
      r.cleanliness || '',
      r.recommend || '',
      (r.likes || '').replace(/"/g, '""'),
      (r.improvements || '').replace(/"/g, '""'),
      r.frequency || '',
      r.mealCard || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raptor-dfac-survey-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Sorted + searched responses for table ────────────────
  const tableData = useMemo(() => {
    let data = [...filteredResponses];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      data = data.filter(r =>
        (r.likes || '').toLowerCase().includes(q) ||
        (r.improvements || '').toLowerCase().includes(q) ||
        (r.meal || '').toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === 'timestamp') { va = new Date(va); vb = new Date(vb); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredResponses, searchText, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const CHART_COLORS = ['#e8b931', '#4a7c59', '#5b8def', '#ef4444', '#a855f7', '#ec4899'];
  const PIE_COLORS = ['#e8b931', '#4a7c59', '#5b8def'];

  // ── Login Screen ─────────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={S.loginWrap}>
        <div style={S.loginCard}>
          <div style={S.loginIcon}>🔒</div>
          <h2 style={S.loginTitle}>Raptors Nest DFAC</h2>
          <p style={S.loginSub}>Admin Dashboard</p>
          <form onSubmit={handleLogin}>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={S.loginInput}
              autoFocus
            />
            <button type="submit" style={S.loginBtn}>ACCESS DASHBOARD</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={S.spinner} />
        <p style={{ color: '#a0a0b0', marginTop: 16 }}>Loading survey data...</p>
      </div>
    );
  }

  // ── Helper: stat color based on rating ───────────────────
  const ratingColor = (val) => {
    if (val >= 4) return '#22c55e';
    if (val >= 3) return '#eab308';
    return '#ef4444';
  };

  const npsColor = (val) => {
    if (val >= 50) return '#22c55e';
    if (val >= 0) return '#eab308';
    return '#ef4444';
  };

  // ── Stars helper ─────────────────────────────────────────
  const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return (
    <div style={S.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <h1 style={S.headerTitle}>RAPTORS NEST DFAC</h1>
          <p style={S.headerSub}>Survey Analytics Dashboard</p>
        </div>
        <div style={S.headerActions}>
          <button onClick={exportCSV} style={S.exportBtn}>⬇ EXPORT CSV</button>
          <button onClick={loadResponses} style={S.refreshBtn}>↻ REFRESH</button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div style={S.filterBar}>
        <div style={S.filterGroup}>
          <span style={S.filterLabel}>Period:</span>
          {[
            { key: 'today', label: 'Today' },
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: 'all', label: 'All Time' },
          ].map(f => (
            <button key={f.key} onClick={() => setTimeFilter(f.key)}
              style={{ ...S.filterBtn, ...(timeFilter === f.key ? S.filterBtnActive : {}) }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={S.filterGroup}>
          <span style={S.filterLabel}>Meal:</span>
          {[
            { key: 'all', label: 'All' },
            { key: 'breakfast', label: 'BF' },
            { key: 'lunch', label: 'LU' },
            { key: 'dinner', label: 'DN' },
          ].map(f => (
            <button key={f.key} onClick={() => setMealFilter(f.key)}
              style={{ ...S.filterBtn, ...(mealFilter === f.key ? S.filterBtnActive : {}) }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={S.filterCount}>
          {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Tab Nav ────────────────────────────────────── */}
      <div style={S.tabBar}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'trends', label: 'Trends' },
          { key: 'feedback', label: 'Feedback' },
          { key: 'responses', label: 'Responses' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ ...S.tabBtn, ...(activeTab === t.key ? S.tabBtnActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━ OVERVIEW TAB ━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards */}
          <div style={S.kpiGrid}>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>TOTAL RESPONSES</div>
              <div style={S.kpiValue}>{stats.n}</div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>OVERALL RATING</div>
              <div style={{ ...S.kpiValue, color: ratingColor(stats.overall) }}>
                {stats.overall.toFixed(1)} <span style={S.kpiStar}>★</span>
              </div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>NPS SCORE</div>
              <div style={{ ...S.kpiValue, color: npsColor(stats.nps) }}>{stats.nps}</div>
              <div style={S.kpiSub}>{stats.recPct}% recommend</div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>FOOD QUALITY</div>
              <div style={{ ...S.kpiValue, color: ratingColor(stats.avgFood) }}>
                {stats.avgFood.toFixed(1)} <span style={S.kpiStar}>★</span>
              </div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>SATISFACTION</div>
              <div style={{ ...S.kpiValue, color: ratingColor(stats.avgSat) }}>
                {stats.avgSat.toFixed(1)} <span style={S.kpiStar}>★</span>
              </div>
            </div>
            <div style={S.kpiCard}>
              <div style={S.kpiLabel}>CLEANLINESS</div>
              <div style={{ ...S.kpiValue, color: ratingColor(stats.avgClean) }}>
                {stats.avgClean.toFixed(1)} <span style={S.kpiStar}>★</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={S.chartRow}>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Responses by Meal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={mealData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {mealData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Station Popularity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stationData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#a0a0b0', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                  <Bar dataKey="value" fill="#4a7c59" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ratingDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {ratingDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0b0' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day of Week Performance */}
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Performance by Day of Week</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
                <XAxis dataKey="day" tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a0a0b0' }} />
                <Bar dataKey="avgFood" fill="#5b8def" name="Food" radius={[2, 2, 0, 0]} />
                <Bar dataKey="avgSat" fill="#4a7c59" name="Satisfaction" radius={[2, 2, 0, 0]} />
                <Bar dataKey="avgClean" fill="#a855f7" name="Cleanliness" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ━━━━━━━━━━━━━━ TRENDS TAB ━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'trends' && (
        <>
          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Ratings Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
                <XAxis dataKey="date" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#a0a0b0' }} />
                <Line type="monotone" dataKey="food" stroke="#5b8def" name="Food" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="satisfaction" stroke="#4a7c59" name="Satisfaction" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="clean" stroke="#a855f7" name="Cleanliness" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={S.chartCard}>
            <h3 style={S.chartTitle}>Response Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
                <XAxis dataKey="date" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
                <YAxis tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                <Area type="monotone" dataKey="count" fill="#4a7c5940" stroke="#4a7c59" name="Responses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={S.chartRow}>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Volume by Day of Week</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
                  <XAxis dataKey="day" tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                  <Bar dataKey="count" fill="#e8b931" name="Responses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.chartCard}>
              <h3 style={S.chartTitle}>Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d3d5c" />
                  <XAxis dataKey="name" tick={{ fill: '#a0a0b0', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#a0a0b0', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#2d3142', border: 'none', color: '#fff', borderRadius: 6 }} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {ratingDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ━━━━━━━━━━━━━━ FEEDBACK TAB ━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'feedback' && (
        <>
          <div style={S.feedbackRow}>
            {/* Improvements */}
            <div style={S.feedbackCard}>
              <h3 style={{ ...S.chartTitle, color: '#ef4444' }}>⚠ Areas for Improvement</h3>
              {topImprovements.length === 0 ? (
                <p style={S.noData}>No improvement feedback yet</p>
              ) : topImprovements.map((item, i) => (
                <div key={i} style={S.themeItem}
                  onClick={() => setExpandedTheme(expandedTheme === `imp-${i}` ? null : `imp-${i}`)}>
                  <div style={S.themeHeader}>
                    <span style={{ ...S.themeBadge, backgroundColor: '#ef4444' }}>#{i + 1}</span>
                    <span style={S.themeName}>{item.theme}</span>
                    <span style={S.themeCount}>{item.count}x</span>
                  </div>
                  {expandedTheme === `imp-${i}` && (
                    <div style={S.themeComments}>
                      {item.comments.slice(0, 5).map((c, j) => (
                        <div key={j} style={S.themeComment}>"{c}"</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Likes / Sustainments */}
            <div style={S.feedbackCard}>
              <h3 style={{ ...S.chartTitle, color: '#22c55e' }}>✓ What's Working</h3>
              {topLikes.length === 0 ? (
                <p style={S.noData}>No positive feedback yet</p>
              ) : topLikes.map((item, i) => (
                <div key={i} style={S.themeItem}
                  onClick={() => setExpandedTheme(expandedTheme === `like-${i}` ? null : `like-${i}`)}>
                  <div style={S.themeHeader}>
                    <span style={{ ...S.themeBadge, backgroundColor: '#22c55e' }}>#{i + 1}</span>
                    <span style={S.themeName}>{item.theme}</span>
                    <span style={S.themeCount}>{item.count}x</span>
                  </div>
                  {expandedTheme === `like-${i}` && (
                    <div style={S.themeComments}>
                      {item.comments.slice(0, 5).map((c, j) => (
                        <div key={j} style={S.themeComment}>"{c}"</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ━━━━━━━━━━━━━━ RESPONSES TAB ━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'responses' && (
        <>
          <div style={S.tableControls}>
            <input
              type="text" value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search feedback text..."
              style={S.searchInput}
            />
            <span style={S.tableInfo}>
              Showing {tableData.length} of {filteredResponses.length}
            </span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  {[
                    { key: 'timestamp', label: 'Date' },
                    { key: 'meal', label: 'Meal' },
                    { key: 'foodQuality', label: 'Food' },
                    { key: 'customerSatisfaction', label: 'Satis.' },
                    { key: 'cleanliness', label: 'Clean' },
                    { key: 'recommend', label: 'Rec' },
                  ].map(col => (
                    <th key={col.key} style={S.th} onClick={() => handleSort(col.key)}>
                      {col.label} {sortField === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th style={S.th}>Likes</th>
                  <th style={S.th}>Improvements</th>
                </tr>
              </thead>
              <tbody>
                {tableData.slice(0, 50).map((r, i) => (
                  <tr key={r.key || i} style={i % 2 === 0 ? S.trEven : S.trOdd}>
                    <td style={S.td}>{new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={S.td}>{(r.meal || '').charAt(0).toUpperCase() + (r.meal || '').slice(1)}</td>
                    <td style={{ ...S.td, color: ratingColor(r.foodQuality) }}>{r.foodQuality}/5</td>
                    <td style={{ ...S.td, color: ratingColor(r.customerSatisfaction) }}>{r.customerSatisfaction}/5</td>
                    <td style={{ ...S.td, color: ratingColor(r.cleanliness) }}>{r.cleanliness}/5</td>
                    <td style={{ ...S.td, color: r.recommend === 'yes' ? '#22c55e' : '#ef4444' }}>
                      {r.recommend === 'yes' ? '✓' : '✗'}
                    </td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.likes || '—'}
                    </td>
                    <td style={{ ...S.td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.improvements || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tableData.length > 50 && (
              <p style={{ color: '#a0a0b0', textAlign: 'center', padding: 12, fontSize: 13 }}>
                Showing first 50 of {tableData.length} — export CSV for full data
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ── Styles (Dark theme matching survey) ──────────────────────
const S = {
  // Login
  loginWrap: {
    minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginCard: {
    backgroundColor: '#2d3142', padding: 40, borderRadius: 12,
    maxWidth: 380, width: '100%', textAlign: 'center',
    border: '1px solid #3d3d5c',
  },
  loginIcon: { fontSize: 48, marginBottom: 16 },
  loginTitle: { color: '#e8b931', fontSize: 20, fontWeight: 700, margin: '0 0 4px' },
  loginSub: { color: '#a0a0b0', fontSize: 14, margin: '0 0 24px' },
  loginInput: {
    width: '100%', padding: 14, backgroundColor: '#1a1a2e', border: '1px solid #3d3d5c',
    borderRadius: 8, color: '#fff', fontSize: 16, boxSizing: 'border-box', marginBottom: 12,
    outline: 'none',
  },
  loginBtn: {
    width: '100%', padding: 14, backgroundColor: '#e8b931', color: '#1a1a2e',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 1,
  },

  // Loading
  loadingWrap: {
    minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  spinner: {
    width: 40, height: 40, border: '4px solid #3d3d5c', borderTopColor: '#e8b931',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  // Layout
  container: {
    minHeight: '100vh', backgroundColor: '#1a1a2e', padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#ffffff', maxWidth: 1200, margin: '0 auto',
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #e8b931',
    flexWrap: 'wrap', gap: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: 700, margin: 0, color: '#e8b931', letterSpacing: 2 },
  headerSub: { fontSize: 13, color: '#a0a0b0', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: 8 },
  exportBtn: {
    padding: '8px 16px', backgroundColor: '#4a7c59', color: '#fff', border: 'none',
    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5,
  },
  refreshBtn: {
    padding: '8px 16px', backgroundColor: '#2d3142', color: '#e8b931', border: '1px solid #3d3d5c',
    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },

  // Filters
  filterBar: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16,
    backgroundColor: '#2d3142', padding: '12px 16px', borderRadius: 8,
    flexWrap: 'wrap',
  },
  filterGroup: { display: 'flex', alignItems: 'center', gap: 6 },
  filterLabel: { fontSize: 11, color: '#a0a0b0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 },
  filterBtn: {
    padding: '6px 12px', backgroundColor: '#1a1a2e', color: '#a0a0b0', border: 'none',
    borderRadius: 4, fontSize: 12, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s',
  },
  filterBtnActive: { backgroundColor: '#4a7c59', color: '#fff' },
  filterCount: { marginLeft: 'auto', fontSize: 12, color: '#a0a0b0', fontWeight: 600 },

  // Tabs
  tabBar: {
    display: 'flex', gap: 4, marginBottom: 20, backgroundColor: '#2d3142',
    padding: 4, borderRadius: 8,
  },
  tabBtn: {
    flex: 1, padding: '12px 16px', backgroundColor: 'transparent', color: '#a0a0b0',
    border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
  },
  tabBtnActive: { backgroundColor: '#e8b931', color: '#1a1a2e' },

  // KPI Cards
  kpiGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12, marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#2d3142', padding: '18px 16px', borderRadius: 8,
    borderLeft: '3px solid #3d3d5c',
  },
  kpiLabel: {
    fontSize: 10, color: '#a0a0b0', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 6,
  },
  kpiValue: { fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 },
  kpiStar: { fontSize: 18, color: '#e8b931' },
  kpiSub: { fontSize: 11, color: '#a0a0b0', marginTop: 4 },

  // Charts
  chartRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16, marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#2d3142', padding: 20, borderRadius: 8, marginBottom: 16,
  },
  chartTitle: { margin: '0 0 16px', fontSize: 14, color: '#e8b931', fontWeight: 600 },

  // Feedback
  feedbackRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  },
  feedbackCard: {
    backgroundColor: '#2d3142', padding: 20, borderRadius: 8,
  },
  noData: { color: '#a0a0b0', textAlign: 'center', padding: 20, fontSize: 13 },
  themeItem: {
    padding: '12px 14px', backgroundColor: '#1a1a2e', borderRadius: 6,
    marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s',
    border: '1px solid #3d3d5c',
  },
  themeHeader: { display: 'flex', alignItems: 'center', gap: 10 },
  themeBadge: {
    color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11,
    fontWeight: 700, minWidth: 28, textAlign: 'center',
  },
  themeName: { flex: 1, fontWeight: 600, fontSize: 14, color: '#fff' },
  themeCount: { fontSize: 12, color: '#a0a0b0', fontWeight: 600 },
  themeComments: { marginTop: 10, paddingTop: 10, borderTop: '1px solid #3d3d5c' },
  themeComment: {
    fontSize: 13, color: '#a0a0b0', fontStyle: 'italic', padding: '6px 10px',
    backgroundColor: '#2d3142', borderRadius: 4, marginBottom: 4, lineHeight: 1.4,
    borderLeft: '2px solid #3d3d5c',
  },

  // Table
  tableControls: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  searchInput: {
    flex: 1, padding: '10px 14px', backgroundColor: '#2d3142', border: '1px solid #3d3d5c',
    borderRadius: 6, color: '#fff', fontSize: 14, outline: 'none', maxWidth: 400,
  },
  tableInfo: { fontSize: 12, color: '#a0a0b0' },
  tableWrap: { overflowX: 'auto', borderRadius: 8, border: '1px solid #3d3d5c' },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 13,
  },
  th: {
    padding: '12px 14px', backgroundColor: '#2d3142', color: '#e8b931', fontWeight: 600,
    fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left',
    borderBottom: '2px solid #3d3d5c', cursor: 'pointer', whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  td: {
    padding: '10px 14px', borderBottom: '1px solid #2d3142', fontSize: 13,
  },
  trEven: { backgroundColor: '#1a1a2e' },
  trOdd: { backgroundColor: '#22223a' },
};

export default AdminPage;
