/**
 * @fileoverview Utility functions for CSS class colors
 * @description Type declarations for classColors module
 */

/**
 * Get tier color CSS classes
 * @param tier - Tier classification (S, A, B, C, D)
 * @returns CSS class string
 */
export function getTierColor(tier: string): string;

/**
 * Get provider color CSS classes
 * @param provider - Provider name
 * @returns CSS class string
 */
export function getProviderColor(provider: string): string;

/**
 * Get scenario color CSS classes
 * @param scenario - Scenario name
 * @returns CSS class string
 */
export function getScenarioColor(scenario: string): string;
