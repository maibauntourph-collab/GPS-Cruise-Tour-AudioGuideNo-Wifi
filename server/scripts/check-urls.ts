import { db } from '../db';
import { inArray } from 'drizzle-orm';
import { landmarks } from '../../shared/schema';

async function run() {
    const rests = await db.select().from(landmarks).where(inArray(landmarks.category, ['Restaurant', 'Shopping', 'Gift Shop']));
    const withUrl = rests.filter(r => r.reservationUrl);
    console.log('Total Restaurants/Shopping:', rests.length);
    console.log('With URL:', withUrl.length);
    process.exit(0);
}
run();
