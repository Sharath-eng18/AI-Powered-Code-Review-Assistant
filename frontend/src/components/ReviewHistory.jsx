import React from 'react';

export default function ReviewHistory({
  reviews,
  page,
  pages,
  total,
  onViewDetails,
  repoFilter,
  setRepoFilter,
  statusFilter,
  setStatusFilter,
  onPageChange
}) {
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div 
      className="brutal-border brutal-shadow"
      style={{
        backgroundColor: 'var(--surface-container-lowest)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}
    >
      {/* Header and filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', textTransform: 'uppercase' }}>Review Logs</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
            Historical logs of AI pull request analyses
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Repository search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.5rem', color: 'var(--primary)' }}>search</span>
            <input
              type="text"
              placeholder="SEARCH REPOS..."
              className="brutal-input"
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              style={{ pl: '2rem', paddingLeft: '2.25rem', width: '220px' }}
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              border: '3px solid var(--primary)',
              background: 'var(--surface-container-lowest)',
              color: 'var(--primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              outline: 'none',
              cursor: 'pointer',
              borderRadius: 0
            }}
          >
            <option value="">ALL STATUSES</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="brutal-border" style={{ overflowX: 'auto', backgroundColor: 'var(--surface-container-lowest)' }}>
        <table className="brutal-table">
          <thead>
            <tr>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Repository</th>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Pull Request</th>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Author</th>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Status</th>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Issues Found</th>
              <th style={{ borderRight: '2px solid var(--primary)' }}>Analyzed At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review.id}>
                  <td style={{ fontWeight: 800, borderRight: '2px solid var(--primary)' }}>
                    {review.repo}
                  </td>
                  <td style={{ borderRight: '2px solid var(--primary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{review.pr_title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>#{review.pr_number}</span>
                    </div>
                  </td>
                  <td style={{ borderRight: '2px solid var(--primary)', fontWeight: 500 }}>{review.pr_author}</td>
                  <td style={{ borderRight: '2px solid var(--primary)' }}>
                    <span className={`brutal-badge ${review.status === 'SUCCESS' ? 'brutal-badge-success' : 'brutal-badge-error'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td style={{ borderRight: '2px solid var(--primary)' }}>
                    {review.status === 'SUCCESS' ? (
                      <span style={{
                        fontWeight: 800,
                        color: review.total_issues > 0 ? 'var(--secondary)' : 'var(--tertiary)'
                      }}>
                        {review.total_issues} ISSUES
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ borderRight: '2px solid var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}>{formatDate(review.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="brutal-button"
                      onClick={() => onViewDetails(review.id)}
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', border: '2px solid var(--primary)', boxShadow: '2px 2px 0px 0px var(--primary)' }}
                    >
                      VIEW DETAILS
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>info</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
                      No review logs match your filter criteria.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {total > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '3px solid var(--primary)',
          paddingTop: '1.25rem',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
          <span>Showing Page <strong>{page}</strong> of <strong>{pages || 1}</strong> ({total} total logs)</span>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="brutal-button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: '0.375rem 0.75rem',
                borderWidth: '2px',
                boxShadow: '2px 2px 0px var(--primary)'
              }}
            >
              PREVIOUS
            </button>
            <button
              className="brutal-button"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: '0.375rem 0.75rem',
                borderWidth: '2px',
                boxShadow: '2px 2px 0px var(--primary)'
              }}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
