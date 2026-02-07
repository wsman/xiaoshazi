// PageSkeleton Component - 页面级骨架屏
// Created: 2026-02-07
// Adapted: Removed dependency on ../atoms/Card (using Tailwind div instead)

import React from 'react';
import './PageSkeleton.css';

export const PageSkeleton = ({
  type = 'default',
  showHeader = true,
  showSidebar = true,
  showMainContent = true,
  customContent,
}) => {
  if (customContent) {
    return <div className="page-skeleton">{customContent}</div>;
  }

  const renderSkeletonForType = () => {
    switch (type) {
      case 'dashboard':
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header">
                <div className="page-skeleton__title skeleton-pulse" style={{ width: '200px', height: '32px' }} />
                <div className="page-skeleton__actions skeleton-pulse" style={{ width: '100px', height: '32px' }} />
              </div>
            )}
            
            {showMainContent && (
              <div className="page-skeleton__content">
                {/* 数据卡片区域 */}
                <div className="page-skeleton__cards-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="skeleton-pulse" style={{ height: '80px' }} />
                    </div>
                  ))}
                </div>
                
                {/* 主内容区域 */}
                <div className="page-skeleton__main-grid">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="skeleton-pulse" style={{ height: '400px' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        );
        
      case 'market':
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header">
                <div className="page-skeleton__title skeleton-pulse" style={{ width: '150px', height: '28px' }} />
                <div className="page-skeleton__actions">
                  <div className="skeleton-pulse" style={{ width: '80px', height: '32px' }} />
                  <div className="skeleton-pulse" style={{ width: '80px', height: '32px' }} />
                </div>
              </div>
            )}
            
            {showMainContent && (
              <div className="page-skeleton__content">
                {/* 市场表格骨架 */}
                <div className="page-skeleton__market-grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="market-item-skeleton skeleton-pulse" style={{ height: '120px' }} />
                  ))}
                </div>
              </div>
            )}
          </>
        );
        
      default:
        // 通用骨架屏
        return (
          <>
            {showHeader && (
              <div className="page-skeleton__header skeleton-pulse" style={{ height: '64px' }} />
            )}
            
            {showSidebar && (
              <div className="page-skeleton__sidebar skeleton-pulse" style={{ width: '200px', height: '100%' }} />
            )}
            
            {showMainContent && (
              <div className="page-skeleton__main skeleton-pulse" style={{ height: '600px' }} />
            )}
          </>
        );
    }
  };

  return (
    <div className="page-skeleton">
      {renderSkeletonForType()}
    </div>
  );
};

export default PageSkeleton;