import express from 'express';
import apiHandler from '../api/index'; // default export

async function runTest() {
    console.log('--- Starting Route Verification (Vercel Simulation) ---');

    // Mock Request/Response
    // We need to simulate how Vercel calls the handler.
    // The handler expects (req, res).
    // We can use a real Express app to drive it, OR just call it.
    // But apiHandler uses 'app(req, res)' internally where 'app' is an Express instance.
    // So we can treat apiHandler as a middleware or just a request handler.

    const simApp = express();

    // Mount the Vercel handler.
    // In Vercel, requests to /api/cities hit the handler.
    // The handler calls app(req, res).
    // If app is a standard express app, it should route based on req.url.

    simApp.all('*', (req, res) => {
        console.log(`[Sim] Request: ${req.method} ${req.url}`);
        apiHandler(req, res);
    });

    const PORT = 3456;
    const server = simApp.listen(PORT, async () => {
        console.log(`[Sim] Server listening on port ${PORT}`);

        try {
            // Test /api/cities
            console.log('[Test] Fetching /api/cities...');
            const response = await fetch(`http://localhost:${PORT}/api/cities`);
            console.log(`[Test] Status: ${response.status}`);

            if (response.status === 200) {
                const data = await response.json();
                console.log(`[Test] Data received: ${Array.isArray(data) ? data.length + ' cities' : 'Invalid data'}`);
                if (Array.isArray(data) && data.length > 0) {
                    console.log('SUCCESS: /api/cities returned data.');
                    console.log('Sample:', data[0].name);
                } else {
                    console.error('FAILURE: /api/cities returned empty or invalid data.');
                }
            } else {
                console.error('FAILURE: /api/cities did not return 200.');
                const text = await response.text();
                console.log('Response:', text);
            }

            // Test /api/debug-routes
            console.log('\n[Test] Fetching /api/debug-routes...');
            const debugRes = await fetch(`http://localhost:${PORT}/api/debug-routes`);
            if (debugRes.status === 200) {
                const debugData = await debugRes.json();
                console.log(`[Test] Routes registered: ${debugData.totalRoutes}`);
                // console.log(JSON.stringify(debugData.routes, null, 2));
            } else {
                console.log('[Test] /api/debug-routes failed.');
            }

        } catch (e) {
            console.error('[Test] Exception during fetch:', e);
        } finally {
            server.close();
            console.log('--- Verification Finished ---');
            process.exit(0);
        }
    });
}

runTest();
