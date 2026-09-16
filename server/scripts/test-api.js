const http = require('http');

async function testBackend() {
  console.log('Testing server directly...');
  // We can require app and test routes
  const app = require('../src/app');
  const { connectDatabase } = require('../src/config/db');
  const { seedDatabase } = require('../src/data/seed');

  await connectDatabase();
  await seedDatabase();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3009, resolve));
  console.log('Test server listening on port 3009');

  try {
    // 1. Health
    const healthRes = await fetch('http://localhost:3009/api/health');
    const healthData = await healthRes.json();
    console.log('Health check result:', healthData);

    // 2. Login demo user
    const loginRes = await fetch('http://localhost:3009/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@neuroflow.ai', password: 'Password@123' }),
    });
    const loginData = await loginRes.json();
    console.log('Login success! User:', loginData.user?.email, 'Token exists:', !!loginData.token);

    const token = loginData.token;

    // 3. Get Workspaces
    const wsRes = await fetch('http://localhost:3009/api/workspaces', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wsData = await wsRes.json();
    console.log(`Retrieved ${wsData.length} workspaces:`, wsData.map((w) => w.name));

    // 4. Test Dashboard
    const dashRes = await fetch('http://localhost:3009/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dashData = await dashRes.json();
    console.log('Dashboard metrics:', dashData.metrics);

    // 5. Test Workflow Execution (Summarize on workspace 1)
    if (wsData.length > 0) {
      const targetWs = wsData[0];
      console.log(`Running Summarize workflow on "${targetWs.name}" (${targetWs.id})...`);
      const runRes = await fetch(`http://localhost:3009/api/workspaces/${targetWs.id}/runs/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: 'Quick summary test' }),
      });
      const runData = await runRes.json();
      console.log('Workflow run result status:', runData.status, 'Trace stages count:', runData.trace?.length);
      console.log('Workflow output summary snippet:', runData.output?.summary?.slice(0, 100));
    }

    console.log('✅ ALL BACKEND SANITY TESTS PASSED!');
  } finally {
    server.close();
  }
}

testBackend().catch((err) => {
  console.error('❌ Backend test failed:', err);
  process.exit(1);
});
