import { useEffect, useState } from 'react';
import CostEfficiencyDisplay from './CostEfficiencyDisplay';
import './ScrollingEconomicColumn.css';

const ScrollingEconomicColumn = ({ data, direction = 'down', speed = 20, width = '100%' }) => {
  // To create a seamless loop, we double the data
  const [displayData, setDisplayData] = useState([]);

  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      // Repeat the data multiple times to ensure enough height for looping
      setDisplayData([...data, ...data, ...data, ...data]);
    } else {
      // 防御性编程：如果data无效，设为空数组
      setDisplayData([]);
    }
  }, [data]);

  // 防御性编程：确保displayData是数组
  const safeDisplayData = Array.isArray(displayData) ? displayData : [];

  return (
    <div className={`scrolling-column-container ${direction} pointer-events-none`}>
      <div 
        className="scrolling-column-track"
        style={{ 
          animationDuration: `${speed}s`,
          animationDirection: direction === 'up' ? 'normal' : 'reverse'
        }}
      >
        {safeDisplayData.map((item, index) => {
          // 防御性编程：检查item是否为有效对象
          if (!item || typeof item !== 'object') {
            return (
              <div 
                key={`empty-${index}`}
                className="scrolling-item-wrapper p-2" 
                style={{ width: width, height: '140px' }}
              >
                <div className="w-full h-full animate-pulse bg-gray-100 rounded"></div>
              </div>
            );
          }
          
          return (
            <div 
              key={`${item.model || 'item'}-${index}`} 
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
          );
        })}
      </div>
    </div>
  );
};

export default ScrollingEconomicColumn;
