import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const sql = neon(process.env.NOWIFIGPSTOURS!);
    try {
        const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cities'
    `;
        console.log("Cities table columns:", JSON.stringify(result, null, 2));

        const landmarkResult = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'landmarks'
    `;
        console.log("Landmarks table columns:", JSON.stringify(landmarkResult, null, 2));

        const citiesData = await sql`SELECT * FROM cities`;
        console.log("Cities data:", JSON.stringify(citiesData, null, 2));
    } catch (error) {
        console.error("Database query error:", error);
    } finally {
        process.exit(0);
    }
}

main();
