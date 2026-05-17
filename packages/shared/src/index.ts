export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type UoMType = 'NUMERIC_MIN' | 'NUMERIC_MAX' | 'TIMELINE' | 'ZERO';
export type GoalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED' | 'RETURNED';
export type AchievementStatus = 'NOT_STARTED' | 'ON_TRACK' | 'COMPLETED';
export type CyclePhase = 'GOAL_SETTING' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string;
  managerId?: string;
  department?: { id: string; name: string };
  manager?: { id: string; name: string };
}

export interface GoalDTO {
  id: string;
  goalSheetId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: UoMType;
  target: number;
  deadline?: string;
  weightage: number;
  isShared: boolean;
  sharedFromId?: string;
  isPrimaryOwner: boolean;
}

export interface GoalSheetDTO {
  id: string;
  userId: string;
  cycleId: string;
  status: GoalStatus;
  goals: GoalDTO[];
  user?: UserDTO;
  submittedAt?: string;
  approvedAt?: string;
  lockedAt?: string;
}

export interface AchievementDTO {
  id?: string;
  goalId: string;
  cycleId: string;
  actual?: number;
  actualDate?: string;
  status: AchievementStatus;
  score?: number;
  goal?: GoalDTO;
}

export interface CheckInDTO {
  id: string;
  goalSheetId: string;
  managerId: string;
  cycleId: string;
  comment: string;
  createdAt: string;
  manager?: { name: string };
}

export interface AuditLogDTO {
  id: string;
  userId: string;
  goalId?: string;
  goalSheetId?: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

export interface GoalCycleDTO {
  id: string;
  phase: CyclePhase;
  year: number;
  openDate: string;
  closeDate: string;
  isOverride: boolean;
}

export interface ScoreInput {
  uomType: UoMType;
  target: number;
  actual: number;
  deadline?: Date;
  actualDate?: Date;
}

// Validation
export const GOAL_RULES = {
  MIN_WEIGHTAGE: 10,
  MAX_GOALS: 8,
  TOTAL_WEIGHTAGE: 100,
};

export const THRUST_AREAS = [
  'Revenue',
  'Efficiency',
  'Quality',
  'Delivery',
  'Safety',
  'Innovation',
  'Customer Satisfaction',
  'People Development',
];

export function validateGoalSheet(goals: Array<{ weightage: number }>) {
  const errors: string[] = [];
  if (goals.length === 0) errors.push('At least one goal is required.');
  if (goals.length > GOAL_RULES.MAX_GOALS)
    errors.push(`Maximum ${GOAL_RULES.MAX_GOALS} goals allowed.`);
  const total = goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== GOAL_RULES.TOTAL_WEIGHTAGE)
    errors.push(`Total weightage must equal 100%. Current: ${total}%`);
  const underMin = goals.filter((g) => g.weightage < GOAL_RULES.MIN_WEIGHTAGE);
  if (underMin.length > 0)
    errors.push(
      `Each goal must have at least ${GOAL_RULES.MIN_WEIGHTAGE}% weightage.`
    );
  return errors;
}
