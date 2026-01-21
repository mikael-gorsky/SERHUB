/**
 * Progress status utilities with horizontal gradient color coding
 *
 * Status stages:
 * - 0-25%:   Planned   - warm ivory (#FFFDF0 → #FFF8DC)
 * - 25-50%:  Active    - soft butter yellow (#FFF8DC → #F5E050)
 * - 50-75%:  Advanced  - yellow-green chartreuse (#D4E157 → #9ACD32)
 * - 75-100%: Complete  - vibrant green (#7CB342 → #4CAF50)
 */

export interface ProgressStatus {
  label: string;
  color: string;           // Badge/text styling
  dotColor: string;        // Small indicator dot
  gradient: string;        // CSS linear-gradient for progress bar
  gradientStart: string;   // Start color hex
  gradientEnd: string;     // End color hex
}

export const getProgressStatus = (progress: number, blocked?: boolean): ProgressStatus => {
  if (blocked) {
    return {
      label: 'Blocked',
      color: 'text-red-600 bg-red-50 border-red-100',
      dotColor: 'bg-red-500',
      gradient: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
      gradientStart: '#EF4444',
      gradientEnd: '#DC2626'
    };
  }

  if (progress >= 75) {
    return {
      label: 'Completing',
      color: 'text-green-700 bg-green-50 border-green-200',
      dotColor: 'bg-green-500',
      gradient: 'linear-gradient(90deg, #7CB342 0%, #4CAF50 100%)',
      gradientStart: '#7CB342',
      gradientEnd: '#4CAF50'
    };
  }

  if (progress >= 50) {
    return {
      label: 'Advanced',
      color: 'text-lime-700 bg-lime-50 border-lime-200',
      dotColor: 'bg-lime-500',
      gradient: 'linear-gradient(90deg, #D4E157 0%, #9ACD32 100%)',
      gradientStart: '#D4E157',
      gradientEnd: '#9ACD32'
    };
  }

  if (progress >= 25) {
    return {
      label: 'Active',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      dotColor: 'bg-yellow-400',
      gradient: 'linear-gradient(90deg, #FFF8DC 0%, #F5E050 100%)',
      gradientStart: '#FFF8DC',
      gradientEnd: '#F5E050'
    };
  }

  // 0-25%: Planned
  return {
    label: 'Planned',
    color: 'text-amber-700 bg-amber-50 border-amber-100',
    dotColor: 'bg-amber-300',
    gradient: 'linear-gradient(90deg, #FFFDF0 0%, #FFF8DC 100%)',
    gradientStart: '#FFFDF0',
    gradientEnd: '#FFF8DC'
  };
};

/**
 * Get color for charts (uses the gradient end color for solid fills)
 */
export const getProgressChartColor = (progress: number): string => {
  if (progress >= 75) return '#4CAF50';  // Complete - vibrant green
  if (progress >= 50) return '#9ACD32';  // Advanced - chartreuse
  if (progress >= 25) return '#F5E050';  // Active - butter yellow
  return '#FFF8DC';                       // Planned - warm ivory
};

/**
 * Get a single representative color for small indicators
 */
export const getProgressDotColor = (progress: number): string => {
  if (progress >= 75) return 'bg-green-500';
  if (progress >= 50) return 'bg-lime-500';
  if (progress >= 25) return 'bg-yellow-400';
  return 'bg-amber-300';
};
