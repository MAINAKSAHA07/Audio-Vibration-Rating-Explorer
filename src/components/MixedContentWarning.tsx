import React from 'react';

interface MixedContentWarningProps {
  onDismiss?: () => void;
}

const MixedContentWarning: React.FC<MixedContentWarningProps> = ({ onDismiss }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '500px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>⚠️</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#856404' }}>
            Mixed Content Warning
          </h3>
          <p style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '14px' }}>
            Your browser is blocking the connection to the backend server due to security policies.
          </p>
          <div style={{ fontSize: '13px', color: '#856404' }}>
            <strong>To fix this:</strong>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Look for a shield icon (🛡️) in your browser's address bar</li>
              <li>Click it and select "Load unsafe scripts" or "Proceed to site"</li>
              <li>Or use Chrome with <code>--disable-web-security</code> flag for testing</li>
            </ol>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                backgroundColor: '#856404',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MixedContentWarning;
