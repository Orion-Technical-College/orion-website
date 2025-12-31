"use client";

/**
 * OTC Workspace Route
 * 
 * Orion Technical College workspace with workspaceKey="OTC".
 */

export default function OTCWorkspacePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      padding: '2rem',
      color: 'white' 
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        OTC Workspace
      </h1>
      <p style={{ color: '#888' }}>
        workspaceKey: OTC
      </p>
      <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        This is the Orion Technical College workspace.
      </p>
      <a 
        href="/workspaces" 
        style={{ 
          display: 'inline-block',
          marginTop: '1rem',
          color: '#0ea5e9',
          textDecoration: 'underline'
        }}
      >
        ← Back to Workspaces
      </a>
    </div>
  );
}
