// ============================================
// Context Menu Component
// ============================================
import { useEffect, useRef } from 'react';
import type { ContextMenuItem } from '../../types';
import './ContextMenu.css';

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={ref}
      className="context-menu acrylic"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map(item => {
        if (item.separator) {
          return <div key={item.id} className="context-menu-separator" />;
        }

        return (
          <div key={item.id} className="context-menu-item-wrapper">
            <button
              className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
            >
              {item.icon && <span className="context-menu-icon">{item.icon}</span>}
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
              {item.children && (
                <span className="context-menu-arrow">›</span>
              )}
            </button>

            {/* Submenu */}
            {item.children && (
              <div className="context-submenu acrylic">
                {item.children.map(child => (
                  <button
                    key={child.id}
                    className="context-menu-item"
                    onClick={() => {
                      if (child.onClick) {
                        child.onClick();
                        onClose();
                      }
                    }}
                  >
                    {child.icon && <span className="context-menu-icon">{child.icon}</span>}
                    <span className="context-menu-label">{child.label}</span>
                    {child.shortcut && <span className="context-menu-shortcut">{child.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
