import React from 'react';

interface SelectionConflictPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDeselectPoint: () => void;
  selectedPoint: {
    algorithm: string;
    class: number;
    category: string;
    subcategory: string;
  };
}

const SelectionConflictPopup: React.FC<SelectionConflictPopupProps> = ({
  isOpen,
  onClose,
  onDeselectPoint,
  selectedPoint
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
          </div>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            Selection Conflict
          </h3>
        </div>
        
        <p style={{
          margin: '0 0 16px 0',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          You have a point selected on the line graph:
        </p>
        
        <div style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Algorithm:</strong> {selectedPoint.algorithm}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Category:</strong> {selectedPoint.category}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Sound:</strong> {selectedPoint.subcategory}
          </div>
          <div>
            <strong>Class:</strong> {selectedPoint.class}
          </div>
        </div>
        
        <p style={{
          margin: '0 0 20px 0',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          To use the Algorithm Performance Sunburst, please deselect the line graph point first.
        </p>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onDeselectPoint();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#3b82f6',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            Deselect Point
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionConflictPopup;
