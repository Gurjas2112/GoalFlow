export interface ScoreInput {
  uomType: string;
  target: number;
  actual: number;
  deadline?: Date;
  actualDate?: Date;
}

export function computeScore(input: ScoreInput): number {
  const { uomType, target, actual, deadline, actualDate } = input;

  switch (uomType) {
    case 'NUMERIC_MIN':
      // Higher is better (e.g. revenue). Score = actual / target
      if (target === 0) return 0;
      return Math.min(actual / target, 2); // Cap at 200%

    case 'NUMERIC_MAX':
      // Lower is better (e.g. TAT, cost). Score = target / actual
      if (actual === 0) return 2;
      return Math.min(target / actual, 2);

    case 'TIMELINE':
      // Completed on or before deadline = 100%, else proportional
      if (!deadline || !actualDate) return 0;
      if (actualDate <= deadline) return 1;
      const overdueDays =
        (actualDate.getTime() - deadline.getTime()) / 86400000;
      return Math.max(0, 1 - overdueDays * 0.1); // Lose 10% per day overdue

    case 'ZERO':
      // Zero = success (e.g. safety incidents)
      return actual === 0 ? 1 : 0;

    default:
      return 0;
  }
}
