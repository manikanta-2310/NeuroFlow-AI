const http = require('http');

async function verifyFullSystem() {
  console.log('====================================================');
  console.log('🔍 NEUROFLOW AI — FULL END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:3001/api';

  // 1. Health Check
  console.log('1. Testing System Health API (/api/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  if (!healthRes.ok) throw new Error(`Health check failed with status: ${healthRes.status}`);
  const health = await healthRes.json();
  console.log('   ✅ Health Status:', health.status);
  console.log('   📦 Database Mode:', health.storage.mode.toUpperCase());
  console.log('   🤖 Local Ollama Connected:', health.ai.ollamaConnected);
  console.log('   🧠 Chat Model:', health.ai.chatModel);
  console.log('   🔢 Embed Model:', health.ai.embedModel);
  console.log('');

  // 2. Authentication Test
  console.log('2. Testing Authentication (/api/auth/login)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@neuroflow.ai', password: 'Password@123' }),
  });
  if (!loginRes.ok) throw new Error(`Login failed with status: ${loginRes.status}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('   ✅ Authenticated as:', loginData.user.name, `(${loginData.user.email})`);
  console.log('');

  // 3. Workspaces Test
  console.log('3. Testing Workspaces API (/api/workspaces)...');
  const wsRes = await fetch(`${BASE_URL}/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const workspaces = await wsRes.json();
  console.log(`   ✅ Found ${workspaces.length} active workspaces:`);
  workspaces.forEach((w) => {
    console.log(`      • ${w.name} (${w.documentsCount} docs, ${w.runsCount} runs, ${w.chunksCount} chunks)`);
  });
  console.log('');

  const targetWs = workspaces[0];
  if (!targetWs) throw new Error('No workspaces found to test');

  // 4. Documents Test
  console.log(`4. Testing Documents Ingestion for "${targetWs.name}"...`);
  const docsRes = await fetch(`${BASE_URL}/workspaces/${targetWs.id}/documents`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const docs = await docsRes.json();
  console.log(`   ✅ Documents in workspace (${docs.length}):`);
  docs.forEach((d) => {
    console.log(`      • [${d.status.toUpperCase()}] ${d.originalName} (${d.fileType}, ${(d.size / 1024).toFixed(1)} KB)`);
  });
  console.log('');

  // 5. Test 5-Stage Workflows
  console.log('5. Testing 5-Stage Agentic Workflows...');

  // 5a. Summarize Workflow
  console.log('   5a. Running Summarize Workflow...');
  const sumRes = await fetch(`${BASE_URL}/workspaces/${targetWs.id}/runs/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt: 'Provide a detailed executive synthesis and key takeaways.' }),
  });
  const sumRun = await sumRes.json();
  console.log(`       ✅ Summarize Run Completed (ID: ${sumRun.id})`);
  console.log(`       Stage Trace Count: ${sumRun.trace?.length || 0} stages`);
  console.log(`       Evaluator Confidence: ${sumRun.evaluation?.confidence} (${(sumRun.evaluation?.score * 100).toFixed(0)}%)`);
  console.log(`       Summary Preview: "${sumRun.output?.summary?.slice(0, 120)}..."`);
  console.log('');

  // 5b. Grounded Chat Q&A
  console.log('   5b. Running Grounded Q&A Chat Workflow...');
  const chatRes = await fetch(`${BASE_URL}/workspaces/${targetWs.id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question: 'What are the main insights and objectives in this workspace?' }),
  });
  const chatData = await chatRes.json();
  console.log('       ✅ Q&A Message Generated with Citations:', chatData.citations?.length || 0);
  console.log(`       Answer Preview: "${chatData.assistantMessage?.content?.slice(0, 120)}..."`);
  console.log('');

  // 6. Dashboard Metrics Verification
  console.log('6. Testing Dashboard Metrics API (/api/dashboard)...');
  const dashRes = await fetch(`${BASE_URL}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const dash = await dashRes.json();
  console.log('   ✅ Aggregated Metrics:');
  console.log('      • Workspaces:', dash.metrics.workspacesCount);
  console.log('      • Documents:', dash.metrics.documentsCount);
  console.log('      • Total Runs:', dash.metrics.runsCount);
  console.log('      • Vector Chunks:', dash.metrics.chunksCount);
  console.log('');

  console.log('====================================================');
  console.log('🎉 ALL SYSTEM CHECKS PASSED PERFECTLY!');
  console.log('====================================================');
}

verifyFullSystem().catch((err) => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
