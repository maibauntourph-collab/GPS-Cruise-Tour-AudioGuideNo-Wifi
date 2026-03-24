import fs from 'fs';
import path from 'path';

const dirs = ['dist', 'dist-server', 'dist-worker'];

dirs.forEach(dir => {
    const fullPath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        console.log(`Cleaning ${dir}...`);
        try {
            fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (err) {
            console.warn(`Failed to clean ${dir}: ${err.message}`);
        }
    }
});
