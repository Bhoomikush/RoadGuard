export const HAZARD_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
} as const;

export const HAZARD_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type HazardStatus = typeof HAZARD_STATUS[keyof typeof HAZARD_STATUS];
export type HazardSeverity = typeof HAZARD_SEVERITY[keyof typeof HAZARD_SEVERITY];

export function getHazardTitle(hazard: any): string {
  let hazardType = hazard.description || 'Unknown Hazard';

  if (hazard.ai_detections && Array.isArray(hazard.ai_detections) && hazard.ai_detections.length > 0) {
    const bestDetection = hazard.ai_detections.reduce((prev: any, current: any) =>
      ((prev.confidence || 0) > (current.confidence || 0)) ? prev : current
    );

    if (bestDetection && bestDetection.class_name) {
      const name = bestDetection.class_name.toLowerCase();
      if (name === 'pothole') hazardType = 'Pothole detected';
      else if (name === 'crack') hazardType = 'Crack detected';
      else hazardType = `${name.charAt(0).toUpperCase() + name.slice(1)} detected`;
    }
  } else if (!hazard.description) {
    hazardType = 'Reported Hazard';
  }

  return hazardType;
}
