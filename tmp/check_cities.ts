import { db } from "../server/db";
import { cities } from "../shared/schema";

async function main() {
    try {
        const allCities = await db.select().from(cities);
        console.log(JSON.stringify(allCities, null, 2));
    } catch (error) {
        console.error("Error fetching cities:", error);
    } finally {
        process.exit(0);
    }
}

main();
