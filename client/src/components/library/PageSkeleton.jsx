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
        
      case 'rankings':
        return (
          <>
            {showHeader && (
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                   <div className="flex flex-col items-center md:items-start gap-2">
                     <div className="skeleton-pulse rounded" style={{ width: '100px', height: '16px' }} />
                     <div className="skeleton-pulse rounded-xl" style={{ width: '380px', height: '40px' }} />
                   </div>
                   <div className="flex flex-col items-center md:items-end gap-2">
                     <div className="skeleton-pulse rounded" style={{ width: '100px', height: '16px' }} />
                     <div className="skeleton-pulse rounded-xl" style={{ width: '300px', height: '40px' }} />
                   </div>
                </div>
              </div>
            )}

            {showMainContent && (
              <div className="flex flex-col gap-4 mb-8 w-full max-w-6xl mx-auto">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    {/* Tier Header */}
                    <div className="px-6 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center h-[46px]">
                       <div className="skeleton-pulse rounded" style={{ width: '40px', height: '24px' }} />
                    </div>
                    {/* Content Area */}
                    <div className="bg-white p-4">
                      <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((j) => (
                           <div key={j} className="flex-none w-[190px] h-[230px] rounded-xl border border-gray-100 p-3 bg-[#fcfdfe]">
                              <div className="flex flex-row h-full gap-3">
                                <div className="w-[8px] h-full skeleton-pulse rounded-full" />
                                <div className="flex-1 flex flex-col">
                                   <div className="flex justify-between mb-2">
                                     <div className="w-8 h-6 skeleton-pulse rounded" />
                                     <div className="w-8 h-4 skeleton-pulse rounded" />
                                   </div>
                                   <div className="w-24 h-4 skeleton-pulse rounded mb-1" />
                                   <div className="w-16 h-3 skeleton-pulse rounded mb-auto" />
                                   <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                                      <div className="w-12 h-6 skeleton-pulse rounded" />
                                      <div className="w-12 h-6 skeleton-pulse rounded" />
                                   </div>
                                </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
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