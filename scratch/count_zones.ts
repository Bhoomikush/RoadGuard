import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../backend/.env') });

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(url, key);

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi/2)**2 + Math.cos(phi1)*Math.cos(phi2)*Math.sin(deltaLambda/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

async function run() {
  const { data: hazards } = await supabase.from('hazards').select('*');
  if (!hazards) return console.log('No hazards');

  const activeHazards = hazards.filter((h: any) => h.status !== 'resolved');
  
  const assigned = new Set();
  const zones = [];

  for (const root of activeHazards) {
    if (assigned.has(root.id)) continue;
    
    const cluster = [root];
    assigned.add(root.id);
    
    let added = true;
    while (added) {
      added = false;
      for (const candidate of activeHazards) {
        if (assigned.has(candidate.id)) continue;
        
        let isNear = false;
        for (const member of cluster) {
          const dist = getDistanceMeters(member.latitude, member.longitude, candidate.latitude, candidate.longitude);
          if (dist <= 300) {
            isNear = true;
            break;
          }
        }
        
        if (isNear) {
          cluster.push(candidate);
          assigned.add(candidate.id);
          added = true;
        }
      }
    }
    
    if (cluster.length >= 2) {
      zones.push(cluster);
    }
  }

  console.log(`Total hazards: ${hazards.length}`);
  console.log(`Active hazards: ${activeHazards.length}`);
  console.log(`Calculated risk zones: ${zones.length}`);
}

run();
