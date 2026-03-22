import { spawn } from 'child_process';

console.log('Starting drizzle-kit push with automated responses...');

const child = spawn('npx', ['drizzle-kit', 'push'], { 
  shell: true,
  stdio: ['pipe', 'pipe', 'inherit']
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  
  // Handle the specific prompts for creation
  if (str.includes('Is') && str.includes('created or renamed')) {
    console.log('\n[Auto-Responder] Sending Enter to select "create table/column"...');
    child.stdin.write('\n');
  }
  
  // Sometimes it asks for confirmation after all choices
  if (str.includes('Are you sure you want to push')) {
    console.log('\n[Auto-Responder] Sending "y" to confirm push...');
    child.stdin.write('y\n');
  }

  // Handle "Yes/No" confirmations for potentially destructive changes or schema updates
  if (str.includes('(y/n)')) {
    console.log('\n[Auto-Responder] Sending "y" for (y/n) prompt...');
    child.stdin.write('y\n');
  }
});

child.on('close', (code) => {
  console.log(`\nProcess finished with code ${code}`);
  process.exit(code);
});

// Timeout after 5 minutes to prevent hanging
setTimeout(() => {
  console.log('\nScript timed out after 5 minutes');
  child.kill();
  process.exit(1);
}, 300000);
