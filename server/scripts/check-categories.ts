import { db } from '../db';

async function count() {
    const rs = await db.query.landmarks.findMany();
    const categories = rs.reduce((acc: any, l) => {
        acc[l.category] = (acc[l.category] || 0) + 1;
        return acc;
    }, {});
    console.log('Categories:', categories);
    process.exit(0);
}
count();
