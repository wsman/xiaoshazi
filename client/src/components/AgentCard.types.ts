/**
 * @fileoverview Agent Card Component Types
 * @description Type definitions for AgentCard component
 */

/**
 * Agent data structure
 */
export interface Agent {
  id?: number | string;
  name?: string;
  model?: string;
  role?: string;
  provider?: string;
  status?: string;
  avatar?: string;
  rank?: number;
  diff?: number;
  tier?: string;
  avgPerf?: number;
  peakPerf?: number;
  samples?: number;
  scenarios?: string[];
  [key: string]: unknown;
}

/**
 * Status color configuration
 */
export interface StatusColor {
  bg: string;
  text: string;
  pulse: string;
}

/**
 * AgentCard component props
 */
export interface AgentCardProps {
  /** Agent data object */
  agent: Agent;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show large variant */
  isLarge?: boolean;
  /** Whether to show status label */
  showStatusLabel?: boolean;
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: (agent: Agent) => void;
  /** Hover handler */
  onHover?: (agent: Agent) => void;
}
