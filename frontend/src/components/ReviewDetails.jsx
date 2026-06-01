import React from 'react';

export default function ReviewDetails({ review, onClose }) {
  if (!review) return null;

  // Helper to parse unified diff into files and lines with line numbers
  const parseDiff = (rawDiff) => {
    if (!rawDiff) return [];
    
    const files = [];
    let currentFile = null;
    let currentLineNum = 0;

    const lines = rawDiff.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('diff --git')) {
        const match = line.match(/b\/(.+)$/);
        const filePath = match ? match[1] : 'unknown';
        currentFile = { filePath, lines: [] };
        files.push(currentFile);
        currentLineNum = 0;
      } else if (currentFile) {
        if (line.startsWith('@@')) {
          const match = line.match(/\+(\d+)/);
          if (match) {
            currentLineNum = parseInt(match[1]) - 1;
          }
          currentFile.lines.push({ type: 'header', content: line });
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
          currentLineNum++;
          currentFile.lines.push({ type: 'addition', content: line, lineNum: currentLineNum });
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.lines.push({ type: 'deletion', content: line });
        } else if (line.startsWith('---') || line.startsWith('+++')) {
          currentFile.lines.push({ type: 'meta', content: line });
        } else {
          currentLineNum++;
          currentFile.lines.push({ type: 'normal', content: line, lineNum: currentLineNum });
        }
      }
    });

    return files;
  };

  const parsedFiles = parseDiff(review.raw_diff);

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'error':
        return {
          bg: 'var(--secondary-container)',
          border: 'var(--secondary)',
          text: 'var(--secondary)',
          badgeLabel: 'AI COMMENT • CRITICAL'
        };
      case 'warning':
        return {
          bg: 'var(--warning-container)',
          border: 'var(--primary)',
          text: 'var(--primary)',
          badgeLabel: 'AI COMMENT • WARNING'
        };
      default:
        return {
          bg: 'var(--tertiary-container)',
          border: 'var(--tertiary)',
          text: 'var(--tertiary)',
          badgeLabel: 'AI COMMENT • INFO'
        };
    }
  };

  const findComment = (filePath, lineNum) => {
    if (!review.comments) return null;
    return review.comments.find(
      (c) => c.file_path.trim() === filePath.trim() && c.line_number === lineNum
    );
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--background)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Workspace Header */}
      <div 
        style={{
          padding: '2rem',
          borderBottom: '4px solid var(--primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--background)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span 
              className="brutal-badge" 
              style={{ 
                backgroundColor: 'var(--primary)', 
                color: 'var(--background)',
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem'
              }}
            >
              {review.repo?.full_name || review.repo}
            </span>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              PR #{review.pr?.pr_number || review.pr_number} BY **{review.pr?.author || review.pr_author}**
            </span>
          </div>
          <h2 style={{ fontSize: '2.5rem', textTransform: 'uppercase', lineHeight: '1.1' }}>
            {review.pr?.title || review.pr_title}
          </h2>
        </div>
        
        <button className="brutal-button" onClick={onClose} style={{ padding: '0.75rem 1.5rem' }}>
          CLOSE REVIEW
        </button>
      </div>

      {/* Grid Content Workspace */}
      <div className="brutal-workspace-grid">
        {/* Left Column: Summary Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div 
            className="brutal-border brutal-shadow" 
            style={{ 
              padding: '1.5rem', 
              backgroundColor: 'var(--surface-container)' 
            }}
          >
            <h3 
              style={{ 
                fontSize: '1.15rem', 
                textTransform: 'uppercase', 
                borderBottom: '3px solid var(--primary)', 
                paddingBottom: '0.75rem', 
                marginBottom: '1.25rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}
            >
              <span className="material-symbols-outlined">summarize</span>
              AI Review Summary
            </h3>

            {/* Status and count badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="brutal-border" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Status
                </span>
                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: review.status === 'SUCCESS' ? 'var(--tertiary)' : 'var(--secondary)' }}>
                  {review.status}
                </span>
              </div>
              <div className="brutal-border" style={{ padding: '0.75rem', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)' }}>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Issues
                </span>
                <span style={{ fontWeight: 900, fontSize: '1.25rem', color: review.total_issues > 0 ? 'var(--secondary)' : 'var(--tertiary)' }}>
                  {review.total_issues}
                </span>
              </div>
            </div>

            {/* Main feedback text */}
            <div 
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                backgroundColor: 'var(--surface-container-lowest)',
                padding: '1.25rem',
                border: '2px solid var(--primary)'
              }}
            >
              {review.summary_feedback || <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{review.error_message}</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Code Diff */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div 
            className="brutal-border brutal-shadow" 
            style={{ 
              backgroundColor: 'var(--surface-container)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header bar */}
            <div 
              style={{
                padding: '1rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--background)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '3px solid var(--primary)'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase', color: 'var(--background)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-fixed)' }}>code</span>
                Unified Diff & Findings
              </h3>
            </div>

            {/* Diffs view */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {parsedFiles.length > 0 ? (
                parsedFiles.map((file, fileIdx) => (
                  <div
                    key={fileIdx}
                    className="brutal-border"
                    style={{
                      overflow: 'hidden',
                      backgroundColor: 'var(--surface-container-lowest)'
                    }}
                  >
                    {/* File subheader */}
                    <div 
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--background)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>description</span>
                      {file.filePath}
                    </div>

                    {/* Diff lines list */}
                    <div style={{ overflowX: 'auto', padding: '0.5rem 0', backgroundColor: 'var(--surface-container-lowest)' }}>
                      {file.lines.map((line, lineIdx) => {
                        const inlineComment = line.lineNum ? findComment(file.filePath, line.lineNum) : null;
                        
                        let lineBg = 'transparent';
                        let textColor = 'var(--text-primary)';
                        let prefix = ' ';

                        if (line.type === 'addition') {
                          lineBg = 'var(--surface-container-low)';
                          textColor = 'var(--tertiary)';
                          prefix = '+';
                        } else if (line.type === 'deletion') {
                          lineBg = 'var(--secondary-container)'; // secondary-container / error bg
                          textColor = 'var(--secondary)';
                          prefix = '-';
                        } else if (line.type === 'header') {
                          lineBg = 'var(--surface-container)';
                          textColor = 'var(--primary)';
                          prefix = ' ';
                        }

                        return (
                          <React.Fragment key={lineIdx}>
                            {/* Code line row */}
                            <div 
                              style={{ 
                                display: 'flex', 
                                fontFamily: 'var(--font-mono)', 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 1rem', 
                                backgroundColor: lineBg, 
                                color: textColor,
                                borderBottom: '1px solid var(--surface-container-high)'
                              }}
                            >
                              {/* Line number */}
                              <span style={{ width: '40px', color: 'var(--text-muted)', userSelect: 'none', borderRight: '1px solid var(--outline-variant)', marginRight: '0.75rem' }}>
                                {line.lineNum || ''}
                              </span>
                              <span style={{ width: '15px', color: 'var(--text-muted)', userSelect: 'none' }}>
                                {prefix}
                              </span>
                              <span style={{ whiteSpace: 'pre-wrap', flex: 1 }}>
                                {line.type === 'addition' || line.type === 'deletion'
                                  ? line.content.substring(1)
                                  : line.content}
                              </span>
                            </div>

                            {/* Inline comment block */}
                            {inlineComment && (() => {
                              const style = getSeverityStyle(inlineComment.severity);
                              return (
                                <div 
                                  style={{ 
                                    padding: '0.75rem 1rem 0.75rem 4rem', 
                                    backgroundColor: 'var(--surface-container-low)',
                                    borderBottom: '2px solid var(--primary)'
                                  }}
                                >
                                  <div 
                                    className="brutal-border brutal-shadow-sm"
                                    style={{
                                      backgroundColor: style.bg,
                                      padding: '0.75rem 1rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: style.border }} />
                                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 900, color: style.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {style.badgeLabel}
                                      </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                      {inlineComment.comment}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
                  No code diff findings recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
