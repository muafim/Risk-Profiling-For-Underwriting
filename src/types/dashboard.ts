export type RiskClass = { label: string; count: number; share: number; color: string };
export type ModelMetric = {
  model: string;
  accuracy: number;
  balanced_accuracy: number;
  macro_f1: number;
  weighted_f1: number;
  macro_precision: number;
  macro_recall: number;
};
export type ImportanceRow = {
  feature: string;
  label: string;
  gain: number;
  split: number;
  permutation_macro_f1_drop_mean: number;
  permutation_std: number;
};
export type ReviewSignal = {
  feature: string;
  rawFeature: string;
  direction?: string;
  zScore?: number;
  label: string;
};
export type ReviewCandidate = {
  rank: number;
  maskedCustomerId: string;
  riskProfile: string;
  anomalyScore: number;
  coverageAmount: number;
  premiumAmount: number;
  deductible: number;
  previousClaims: number;
  creditScore: number;
  policyDuration: number;
  drivingRecord: string;
  reviewSignals: ReviewSignal[];
};
