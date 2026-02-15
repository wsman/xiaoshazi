import React, { memo } from 'react';
import { getTierColor } from '../utils/classColors';

const TierBadge = memo(({ tier }) => {
  return (
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md border font-bold ${getTierColor(tier)}`}>
      {tier}
    </div>
  );
});

export default TierBadge;
