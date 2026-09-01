export type ConstraintType =
  | "CLEARANCE"
  | "POWER"
  | "CONNECTOR"
  | "CABLE"
  | "AIRFLOW";

export type ConstraintSeverity = "INFO" | "WARNING" | "ERROR";

export interface ConstraintIssue {
  id: string;
  type: ConstraintType;
  severity: ConstraintSeverity;
  message: string;
  affectedComponentIds: string[];
}

export interface ValidationSummary {
  valid: boolean;
  issues: ConstraintIssue[];
}
