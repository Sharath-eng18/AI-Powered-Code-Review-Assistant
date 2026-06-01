import React, { useState } from 'react';

export default function Navbar({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header (Visible only on mobile) */}
      <header className="brutal-mobile-header">
        <h1 className="font-display font-black text-xl text-primary uppercase" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, margin: 0 }}>PR-SHEILD AI</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Mobile Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 border-2 border-primary active:scale-95"
            style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title={theme === 'light' ? 'SWITCH TO DARK THEME' : 'SWITCH TO LIGHT THEME'}
          >
            <span className="material-symbols-outlined" style={{ display: 'block' }}>
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-primary bg-primary-fixed text-primary active:scale-95"
            style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary-fixed)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ display: 'block' }}>menu</span>
          </button>
        </div>
      </header>

      {/* SideNavBar (Desktop & Mobile Drawer) */}
      <nav className={`brutal-sidebar ${mobileMenuOpen ? 'brutal-sidebar-open' : ''}`}>
        {/* Header */}
        <div style={{ borderBottom: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="font-display font-black text-xl text-primary" style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>BAUHAUS_OS</h1>
            {/* Mobile close button */}
            <button 
              className="p-1 border border-primary active:scale-95"
              onClick={() => setMobileMenuOpen(false)}
              style={{ border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '1.2rem' }}>close</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              alt="System Status" 
              className="w-10 h-10 brutal-border object-cover bg-secondary" 
              style={{ width: '40px', height: '40px', border: '3px solid var(--primary)', objectFit: 'cover', backgroundColor: 'var(--secondary)' }}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDm2bv_WbET9y0w64arDRVGA6_83urea4SWqahAyvlTgxZRGLpg3x2TV6-CgtnbHPHPQLS7tlRwN9shLf5NOQHmTw7D7A3kNmoleUpTV0Mpc4MXJEIGou_N-gG0w_Dw-A339__8EmDXwfkY5svcewhYOZG9paGBw201xM6ULfRjJPWllLQJaBJbl2Ux4OH9Zf3dUn7C6ujzQcoWhTupsROOXIefNOVKv3xvpTmNUYePg6Y-IveD-8MStxVy6jTKkgeUt8Ld-0tMfKNL"
            />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 900 }}>STATUS</div>
              <div style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--primary)' }}>v2.0.4-stable</div>
            </div>
          </div>
          
          <button 
            className="brutal-button bg-primary-fixed text-primary px-4 py-2 mt-2 w-full text-center"
            style={{ backgroundColor: 'var(--primary-fixed)', width: '100%', marginTop: '0.5rem' }}
          >
            NEW ANALYSIS
          </button>
        </div>

        {/* Main Navigation */}
        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <a 
            style={{ 
              backgroundColor: 'var(--primary-container)', 
              color: 'var(--primary)', 
              border: '2px solid var(--primary)', 
              margin: '0 0.5rem 0.5rem 0.5rem', 
              padding: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }} 
            href="#overview"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
            Overview
          </a>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#analytics"
          >
            <span className="material-symbols-outlined">analytics</span>
            Analytics
          </a>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#pull-requests"
          >
            <span className="material-symbols-outlined">merge_type</span>
            Pull Requests
          </a>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#repositories"
          >
            <span className="material-symbols-outlined">inventory_2</span>
            Repositories
          </a>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#ai-config"
          >
            <span className="material-symbols-outlined">psychology</span>
            AI Config
          </a>
        </div>

        {/* Footer Navigation */}
        <div style={{ borderTop: '4px solid var(--primary)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#documentation"
          >
            <span className="material-symbols-outlined">description</span>
            Documentation
          </a>
          <a 
            style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }} 
            href="#support"
          >
            <span className="material-symbols-outlined">help</span>
            Support
          </a>
        </div>
      </nav>
      
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div 
          className="brutal-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
