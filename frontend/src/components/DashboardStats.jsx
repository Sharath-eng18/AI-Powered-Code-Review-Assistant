import React from 'react';

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const totalIssues = 
    (stats.severity_distribution?.error || 0) + 
    (stats.severity_distribution?.warning || 0) + 
    (stats.severity_distribution?.info || 0);

  const getPercent = (value) => {
    if (!totalIssues) return 0;
    return Math.round((value / totalIssues) * 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Bento Grid Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Metric 1: Active Repos */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--primary-container)',
            color: '#1a1a1a',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '160px',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: '#1a1a1a' }}>
              Active Repos
            </span>
            <span className="material-symbols-outlined" style={{ color: '#1a1a1a' }}>inventory_2</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3.75rem', lineHeight: '1', color: '#1a1a1a' }}>
            {stats.total_repos || 0}
          </div>
        </div>

        {/* Metric 2: PRs Tracked */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--surface-bright)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '160px',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
              PRs Tracked
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--tertiary)' }}>merge_type</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3.75rem', lineHeight: '1', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            {stats.total_prs || 0}
            <span style={{ fontSize: '1rem', color: 'var(--tertiary)', fontWeight: 700 }}>+14%</span>
          </div>
        </div>

        {/* Metric 3: AI Reviews */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--secondary)',
            color: '#ffffff',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '160px',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: '#ffffff' }}>
              AI Reviews
            </span>
            <span className="material-symbols-outlined" style={{ color: '#ffffff' }}>psychology</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3.75rem', lineHeight: '1', color: '#ffffff' }}>
            {stats.total_reviews || 0}
          </div>
        </div>

        {/* Metric 4: Avg. Time */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--surface-bright)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '160px',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
              Avg. Time
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>timer</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem', lineHeight: '1' }}>
            {stats.avg_duration_seconds || 0}<span style={{ fontSize: '1.5rem' }}>s</span>
          </div>
        </div>
      </div>

      {/* Widget Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {/* Issue Severity Card */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase' }}>Issue Severity Logs</h3>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-muted)' }}>
              TOTAL: {totalIssues}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Critical/Error */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '80px', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                Critical
              </div>
              <div className="brutal-border" style={{ flex: 1, height: '32px', backgroundColor: 'var(--surface-container-high)', position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    backgroundColor: 'var(--secondary)',
                    width: `${getPercent(stats.severity_distribution?.error)}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
                {stats.severity_distribution?.error || 0}
              </div>
            </div>

            {/* Major/Warning */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '80px', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--primary)' }}>
                Major
              </div>
              <div className="brutal-border" style={{ flex: 1, height: '32px', backgroundColor: 'var(--surface-container-high)', position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    backgroundColor: 'var(--primary-fixed)',
                    width: `${getPercent(stats.severity_distribution?.warning)}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
                {stats.severity_distribution?.warning || 0}
              </div>
            </div>

            {/* Minor/Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '80px', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--tertiary)' }}>
                Minor
              </div>
              <div className="brutal-border" style={{ flex: 1, height: '32px', backgroundColor: 'var(--surface-container-high)', position: 'relative' }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    backgroundColor: 'var(--tertiary)',
                    width: `${getPercent(stats.severity_distribution?.info)}%`,
                    transition: 'width 0.5s ease-out'
                  }}
                />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
                {stats.severity_distribution?.info || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Active Repositories Card */}
        <div 
          className="brutal-border brutal-shadow"
          style={{
            backgroundColor: 'var(--surface-container-lowest)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid var(--primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase' }}>Active Repositories</h3>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>filter_list</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.active_repos && stats.active_repos.length > 0 ? (
              stats.active_repos.map((repo, idx) => (
                <div
                  key={idx}
                  className="brutal-border"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--surface-container-low)'
                  }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                    {repo.repo}
                  </span>
                  <span className="brutal-badge brutal-badge-info" style={{ fontSize: '0.7rem' }}>
                    {repo.pr_count} PRs
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No active repositories tracked yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
