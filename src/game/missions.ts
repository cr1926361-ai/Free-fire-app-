import { DailyMission, PlayerStats } from './types';

export const INITIAL_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'm_kills_3',
    title: 'Bermuda Eliminator',
    description: 'Eliminate 3 enemies across battle royale matches',
    targetCount: 3,
    currentCount: 0,
    rewardType: 'gold',
    rewardAmount: 1000,
    rewardClaimed: false,
    type: 'kills',
  },
  {
    id: 'm_headshot_1',
    title: 'Bullseye Assassin',
    description: 'Score at least 1 crisp headshot elimination',
    targetCount: 1,
    currentCount: 0,
    rewardType: 'diamonds',
    rewardAmount: 50,
    rewardClaimed: false,
    type: 'headshot',
  },
  {
    id: 'm_gloowall_2',
    title: 'Gloo Wall Mastery',
    description: 'Deploy 2 tactical Gloo Walls in intense combat',
    targetCount: 2,
    currentCount: 0,
    rewardType: 'gold',
    rewardAmount: 750,
    rewardClaimed: false,
    type: 'gloowall',
  },
  {
    id: 'm_survive_45',
    title: 'Island Endurance',
    description: 'Survive on Bermuda island for at least 45 seconds',
    targetCount: 45,
    currentCount: 0,
    rewardType: 'gold',
    rewardAmount: 800,
    rewardClaimed: false,
    type: 'survival',
  },
  {
    id: 'm_booyah_1',
    title: 'Claim the Booyah!',
    description: 'Outlast all rivals to secure #1 Victory Champion',
    targetCount: 1,
    currentCount: 0,
    rewardType: 'diamonds',
    rewardAmount: 100,
    rewardClaimed: false,
    type: 'booyah',
  },
];

// Helper to update mission progress based on completed match statistics
export function updateMissionsWithStats(
  missions: DailyMission[],
  stats: PlayerStats,
  isVictory: boolean
): DailyMission[] {
  return missions.map(mission => {
    let newCount = mission.currentCount;

    if (mission.type === 'kills') {
      newCount = Math.min(mission.targetCount, newCount + stats.kills);
    } else if (mission.type === 'headshot') {
      newCount = Math.min(mission.targetCount, newCount + stats.headshots);
    } else if (mission.type === 'gloowall') {
      newCount = Math.min(mission.targetCount, newCount + stats.glooWallsPlaced);
    } else if (mission.type === 'survival') {
      newCount = Math.min(mission.targetCount, Math.max(newCount, stats.survivalTime));
    } else if (mission.type === 'booyah' && isVictory) {
      newCount = Math.min(mission.targetCount, newCount + 1);
    }

    return {
      ...mission,
      currentCount: newCount,
    };
  });
}
