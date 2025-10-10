import { type Landmark } from "@shared/schema";

export interface IStorage {
  getLandmarks(): Promise<Landmark[]>;
  getLandmark(id: string): Promise<Landmark | undefined>;
}

const ROME_LANDMARKS: Landmark[] = [
  {
    id: 'colosseum',
    name: 'Colosseum',
    lat: 41.8902,
    lng: 12.4922,
    radius: 70,
    narration: 'Welcome to the Colosseum, the iconic symbol of Rome. This ancient amphitheater once hosted gladiatorial contests and public spectacles.',
    description: 'The largest amphitheater ever built, a UNESCO World Heritage Site',
    category: 'Ancient Rome'
  },
  {
    id: 'roman_forum',
    name: 'Roman Forum',
    lat: 41.8925,
    lng: 12.4853,
    radius: 60,
    narration: 'You are at the Roman Forum, the heart of ancient Rome. This was the center of political life during the Republic era, where historic buildings still stand.',
    description: 'The center of ancient Roman public life',
    category: 'Ancient Rome'
  },
  {
    id: 'trevi_fountain',
    name: 'Trevi Fountain',
    lat: 41.9009,
    lng: 12.4833,
    radius: 50,
    narration: 'This is the Trevi Fountain. Legend says if you throw a coin over your shoulder into the fountain, you will return to Rome.',
    description: 'The most famous fountain in Rome',
    category: 'Fountain'
  },
  {
    id: 'pantheon',
    name: 'Pantheon',
    lat: 41.8986,
    lng: 12.4768,
    radius: 50,
    narration: 'The Pantheon is a temple dedicated to all the gods. It is a masterpiece of ancient architecture with its magnificent dome.',
    description: 'An architectural marvel with the world\'s largest unreinforced concrete dome',
    category: 'Ancient Rome'
  },
  {
    id: 'spanish_steps',
    name: 'Spanish Steps',
    lat: 41.9059,
    lng: 12.4823,
    radius: 50,
    narration: 'Welcome to the Spanish Steps, famous as a filming location for the movie "Roman Holiday".',
    description: 'A monumental stairway of 135 steps',
    category: 'Landmark'
  }
];

export class MemStorage implements IStorage {
  async getLandmarks(): Promise<Landmark[]> {
    return ROME_LANDMARKS;
  }

  async getLandmark(id: string): Promise<Landmark | undefined> {
    return ROME_LANDMARKS.find(landmark => landmark.id === id);
  }
}

export const storage = new MemStorage();
