/**
 * @fileoverview Tier Badge Component
 * @description Displays tier classification badge (S, A, B, C, D)
 */

import React, { memo } from 'react';
import { getTierColor } from '../utils/classColors';

/**
 * TierBadge component props
 */
interface TierBadgeProps {
  /** Tier classification (S, A, B, C, D) */
  tier: string;
}

/**
 * TierBadge 组件
 * 
 * @description 显示等级徽章
 */
const TierBadge: React.FC<TierBadgeProps> = memo(({ tier }) => {
  return (
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md border font-bold ${getTierColor(tier)}`}>
      {tier}
    </div>
  );
});

TierBadge.displayName = 'TierBadge';

export default TierBadge;
