import React from 'react';

/**
 * A pure CSS implementation of the Magic UI Ripple effect.
 * Renders expanding concentric circles in the background.
 */
export default function Ripple({ 
  mainCircleSize = 150, 
  numCircles = 12,
  className = '' 
}) {
  return (
    <div className={`ripple-container ${className}`}>
      {Array.from({ length: numCircles }, (_, i) => {
        // Render largest first so it sits at the bottom, smallest on top
        const size = mainCircleSize + (numCircles - i - 1) * 70;
        const animationDelay = `${i * 0.06}s`;

        return (
          <div
            key={i}
            className="ripple-circle"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: 1,
              animationDelay,
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.015)', // Accumulating inner glow
            }}
          />
        );
      })}
    </div>
  );
}
