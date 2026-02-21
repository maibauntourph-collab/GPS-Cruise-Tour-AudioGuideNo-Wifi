
import express from "express";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";
import { storage } from "../server/storage";

async function verify() {
    console.log("🔍 Starting Routing Verification...");

    // 1. Check Data Availability
    try {
        const cities = await storage.getCities();
        console.log(`✅ storage.getCities() returned ${cities.length} cities.`);
        if (cities.length > 0) {
            console.log(`   Sample: ${cities[0].name} (${cities[0].id})`);
        } else {
            console.warn("⚠️ No cities found in storage!");
        }
    } catch (error) {
        console.error("❌ Error fetching cities from storage:", error);
    }

    // 2. Setup Express App & Routes
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Mock server setup (similar to server/index.ts)
    const server = await registerRoutes(app);

    // Setup basics for simple request testing (mocking req/res)
    // We can't easy mock full express request without libraries like supertest, 
    // but we can check the route stack.

    console.log("\n🛣️  Registered Routes (API):");
    const routes: string[] = [];
    app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
            // routes registered directly on the app
            const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
            routes.push(`${methods} ${middleware.route.path}`);
            console.log(`   - ${methods} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
            // router middleware
            middleware.handle.stack.forEach((handler: any) => {
                if (handler.route) {
                    const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                    routes.push(`${methods} ${handler.route.path}`);
                    console.log(`   - ${methods} ${handler.route.path}`);
                }
            });
        }
    });

    if (routes.find(r => r.includes("/api/cities"))) {
        console.log("\n✅ SUCCESS: GET /api/cities route is registered.");
    } else {
        console.error("\n❌ FAILURE: GET /api/cities route is MISSING!");
    }

    console.log("\nDone.");
    process.exit(0);
}

verify();
