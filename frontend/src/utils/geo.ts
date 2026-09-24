import type { Hazard } from '../types';

export interface RiskZone {
  id: string;
  center: { lat: number; lng: number };
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  hazardCount: number;
}

/**
 * Calculates the geographic distance between two points using the Haversine formula.
 * Returns distance in meters.
 */
export function getDistanceMeters(lat1: any, lon1: any, lat2: any, lon2: any): number {
  const l1 = Number(lat1);
  const ln1 = Number(lon1);
  const l2 = Number(lat2);
  const ln2 = Number(lon2);

  if (isNaN(l1) || isNaN(ln1) || isNaN(l2) || isNaN(ln2)) return Infinity;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (l1 * Math.PI) / 180;
  const phi2 = (l2 * Math.PI) / 180;
  const deltaPhi = ((l2 - l1) * Math.PI) / 180;
  const deltaLambda = ((ln2 - ln1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getSeverityScore(severity?: string): number {
  const s = (severity || '').toLowerCase();
  switch (s) {
    case 'critical':
      return 3;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      // missing/unknown severity = 1
      return 1;
  }
}

/**
 * Groups active hazards into Risk Zones if they are within 300 meters of each other.
 * A zone must contain at least 2 active hazards.
 */
export function calculateRiskZones(hazards: Hazard[]): RiskZone[] {
  // 1. Ignore resolved hazards
  const activeHazards = hazards.filter((h) => {
    const s = String(h.status || '').toLowerCase();
    return s !== 'resolved';
  });

  console.log(`[RiskZones] Total hazards: ${hazards.length}, Active hazards: ${activeHazards.length}`);

  // Log active hazards explicitly
  activeHazards.forEach(h => {
    console.log(`[RiskZones] Hazard ${h.id}: lat=${h.latitude}, lng=${h.longitude}, status=${h.status}`);
  });

  const zones: RiskZone[] = [];
  const assigned = new Set<string>();

  // 2. Simple clustering algorithm (greedy DBScan-lite)
  for (let i = 0; i < activeHazards.length; i++) {
    const root = activeHazards[i];
    if (assigned.has(root.id)) continue;

    console.log(`[RiskZones] Starting cluster with root ${root.id}`);
    const cluster: Hazard[] = [root];
    assigned.add(root.id);

    // Grow cluster by finding any unassigned hazard within 300m of ANY hazard in the current cluster
    let added: boolean;
    do {
      added = false;
      for (let j = 0; j < activeHazards.length; j++) {
        const candidate = activeHazards[j];
        if (assigned.has(candidate.id)) continue;

        // Check distance against members of the cluster
        let isNear = false;
        for (const member of cluster) {
          const dist = getDistanceMeters(member.latitude, member.longitude, candidate.latitude, candidate.longitude);
          console.log(`[RiskZones] Distance ${member.id} <-> ${candidate.id}: ${dist.toFixed(2)} meters`);
          
          if (dist <= 300) {
            isNear = true;
            break;
          }
        }

        if (isNear) {
          console.log(`[RiskZones] Added ${candidate.id} to cluster`);
          cluster.push(candidate);
          assigned.add(candidate.id);
          added = true;
        }
      }
    } while (added);

    console.log(`[RiskZones] Cluster finished with size ${cluster.length}`);

    // 3. A risk zone must contain at least 2 active hazards
    if (cluster.length >= 2) {
      let score = 0;
      let sumLat = 0;
      let sumLng = 0;

      for (const h of cluster) {
        score += getSeverityScore(h.severity);
        sumLat += Number(h.latitude);
        sumLng += Number(h.longitude);
      }

      // Calculate the zone center using the average latitude and longitude
      const avgLat = sumLat / cluster.length;
      const avgLng = sumLng / cluster.length;

      // Assign zone level based on score
      let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (score >= 6) {
        level = 'HIGH';
      } else if (score >= 3) {
        level = 'MEDIUM';
      }

      const zone: RiskZone = {
        id: `zone-${root.id}`,
        center: { lat: avgLat, lng: avgLng },
        score,
        level,
        hazardCount: cluster.length,
      };
      zones.push(zone);
      console.log(`[RiskZones] Created Zone ${zone.id}`);
    }
  }

  console.log(`[RiskZones] Calculated risk zones count: ${zones.length}`);
  zones.forEach(z => {
    console.log(`[RiskZones] Zone ${z.id}: center=(${z.center.lat.toFixed(4)}, ${z.center.lng.toFixed(4)}), score=${z.score}, level=${z.level}, hazards=${z.hazardCount}`);
  });

  return zones;
}
