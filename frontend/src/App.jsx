import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DashboardStats from './components/DashboardStats';
import ReviewHistory from './components/ReviewHistory';
import ReviewDetails from './components/ReviewDetails';
import './App.css';

// Base API URL pointing to the Flask backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  
  // Selected review details state
  const [selectedReview, setSelectedReview] = useState(null);

  // Filter and pagination state
  const [repoFilter, setRepoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Fetch stats dashboard metrics
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch reviews log history
  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const url = new URL(`${API_BASE}/reviews`);
      url.searchParams.append('page', page);
      url.searchParams.append('per_page', 6);
      if (repoFilter) url.searchParams.append('repo', repoFilter);
      if (statusFilter) url.searchParams.append('status', statusFilter);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch review history', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch single review detail when clicking 'View Details'
  const handleViewDetails = async (reviewId) => {
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReview(data);
      }
    } catch (e) {
      console.error(`Failed to fetch details for review ${reviewId}`, e);
    }
  };

  // Trigger stats loading on load
  useEffect(() => {
    fetchStats();
  }, []);

  // Trigger reviews reloading when page or filters update
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchReviews();
    }, 300); // Debounce typing input

    return () => clearTimeout(delayDebounce);
  }, [page, repoFilter, statusFilter]);

  // When filters are updated, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [repoFilter, statusFilter]);

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Main Workspace with sidebar offset */}
      <div className="main-workspace">
        {/* Desktop Header */}
        <header className="brutal-desktop-header">
          <h2 style={{ fontSize: '2.25rem', textTransform: 'uppercase', fontWeight: 900, fontFamily: 'var(--font-display)', margin: 0 }}>Dashboard</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.5rem', color: 'var(--primary)' }}>search</span>
              <input 
                className="brutal-input" 
                style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem', width: '240px' }} 
                placeholder="SEARCH REPOS..." 
                type="text"
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
              />
            </div>
            
            {/* Trailing Actions */}
            <button 
              onClick={() => {
                fetchStats();
                fetchReviews();
              }}
              className="brutal-button"
              style={{ padding: '0.5rem', border: '2px solid var(--primary)', boxShadow: '2px 2px 0px var(--primary)' }}
              title="Sync Data"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', display: 'block' }}>sync</span>
            </button>
            
            <button 
              className="brutal-button" 
              style={{ padding: '0.5rem', border: '2px solid var(--primary)', boxShadow: '2px 2px 0px var(--primary)', position: 'relative' }}
            >
              <span className="material-symbols-outlined" style={{ display: 'block' }}>notifications</span>
              <span 
                className="brutal-border" 
                style={{ 
                  position: 'absolute', 
                  top: '-3px', 
                  right: '-3px', 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'var(--secondary)', 
                  borderRadius: '50%' 
                }} 
              />
            </button>
            
            <button 
              onClick={toggleTheme}
              className="brutal-button" 
              style={{ padding: '0.5rem', border: '2px solid var(--primary)', boxShadow: '2px 2px 0px var(--primary)' }}
              title={theme === 'light' ? 'SWITCH TO DARK THEME' : 'SWITCH TO LIGHT THEME'}
            >
              <span className="material-symbols-outlined" style={{ display: 'block' }}>
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            <button 
              className="brutal-button" 
              style={{ padding: '0.5rem', border: '2px solid var(--primary)', boxShadow: '2px 2px 0px var(--primary)' }}
            >
              <span className="material-symbols-outlined" style={{ display: 'block' }}>settings</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main 
          style={{ 
            padding: '2rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2.5rem', 
            maxWidth: '1280px',
            margin: '0 auto',
            width: '100%',
            flex: 1
          }}
        >
          {/* Stats View */}
          {loadingStats ? (
            <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              LOADING METRICS...
            </div>
          ) : (
            <DashboardStats stats={stats} />
          )}

          {/* Reviews History Grid */}
          <ReviewHistory
            reviews={reviews}
            page={page}
            pages={pages}
            total={total}
            onViewDetails={handleViewDetails}
            repoFilter={repoFilter}
            setRepoFilter={setRepoFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onPageChange={setPage}
          />
        </main>

        {/* Selected Review Modal Details Workspace */}
        {selectedReview && (
          <ReviewDetails
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
          />
        )}

        {/* Bauhaus Footer */}
        <footer 
          style={{
            textAlign: 'center',
            padding: '1.5rem 2rem',
            borderTop: '4px solid var(--primary)',
            marginTop: 'auto',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--background)',
            backgroundColor: 'var(--primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            <span>©2026 BAUHAUS_CODE_SYSTEMS. FORM FOLLOWS FUNCTION.</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#privacy" style={{ color: 'var(--surface-container-low)', fontSize: '0.75rem' }}>Privacy</a>
              <a href="#terms" style={{ color: 'var(--surface-container-low)', fontSize: '0.75rem' }}>Terms</a>
              <a href="#api" style={{ color: 'var(--surface-container-low)', fontSize: '0.75rem' }}>API_Docs</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
