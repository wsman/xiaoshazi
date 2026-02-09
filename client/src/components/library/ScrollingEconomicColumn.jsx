import React, { useState, useEffect } from 'react';
import CostEfficiencyDisplay from './CostEfficiencyDisplay';
import './ScrollingEconomicColumn.css';

const ScrollingEconomicColumn = ({ data, direction = 'down', speed = 20, width = '100%' }) => {
  // To create a seamless loop, we double the data
  const [displayData, setDisplayData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Repeat the data multiple times to ensure enough height for looping
      setDisplayData([...data, ...data, ...data, ...data]);
    }
  }, [data]);

  return (
    <div className={`scrolling-column-container ${direction} pointer-events-none`}>
      <div 
        className="scrolling-column-track"
        style={{ 
          animationDuration: `${speed}s`,
          animationDirection: direction === 'up' ? 'normal' : 'reverse'
        }}
      >
        {displayData.map((item, index) => (
          <div 
            key={`${item.model}-${index}`} 
            className="scrolling-item-wrapper p-2" 
            style={{ width: width, height: '140px' }}
          >
            <div className="w-full h-full">
              <CostEfficiencyDisplay 
                data={item}
                variant="detailed"
                size="small"
                showDetailsOnHover={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingEconomicColumn;
