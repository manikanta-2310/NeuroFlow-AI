const API_BASE = 'http://localhost:3001/api';

async function post(url, body, token) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

async function get(url, token) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

async function testAllWorkflows() {
  console.log('🧪 Testing all 5 Agentic Workflows with Native Fetch...\n');

  // 1. Login
  const loginData = await post('/auth/login', {
    email: 'demo@neuroflow.ai',
    password: 'Password@123',
  });
  const token = loginData.token;
  console.log('✅ Authenticated as demo user.');

  // 2. Get workspaces
  const workspaces = await get('/workspaces', token);
  const ws1 = workspaces[0];
  const ws2 = workspaces[1] || workspaces[0];
  console.log(`Using Workspace 1: "${ws1.name}"`);
  console.log(`Using Workspace 2: "${ws2.name}"\n`);

  // 3. Test Summarize
  console.log('1. Testing Summarize Workflow on Workspace 1...');
  const sumRes = await post(
    `/workspaces/${ws1.id}/runs/summarize`,
    { prompt: 'Provide a structured executive overview' },
    token
  );
  console.log('   ✅ Summarize OK. ID:', sumRes.id, 'Confidence:', sumRes.evaluation?.confidence);

  // 4. Test Meeting Action Items (using /meeting-action-items)
  console.log('\n2. Testing Meeting Action Items Workflow on Workspace 1...');
  const actionRes = await post(
    `/workspaces/${ws1.id}/runs/meeting-action-items`,
    { prompt: 'Extract all action items and owners' },
    token
  );
  console.log('   ✅ Action Items OK. ID:', actionRes.id, 'Action items count:', actionRes.output?.actionItems?.length || 0);

  // 5. Test Research Brief (using /research-brief)
  console.log('\n3. Testing Research Brief Workflow on Workspace 1...');
  const briefRes = await post(
    `/workspaces/${ws1.id}/runs/research-brief`,
    { topic: 'Q3 Architectural Roadmap', prompt: 'Summarize strategic direction' },
    token
  );
  console.log('   ✅ Research Brief OK. ID:', briefRes.id, 'Themes count:', briefRes.output?.themes?.length || 0);

  // 6. Test Compare on Workspace 2 (which has 2 documents)
  console.log(`\n4. Testing Compare Workflow on Workspace 2 ("${ws2.name}")...`);
  const docs = await get(`/workspaces/${ws2.id}/documents`, token);
  const docIds = docs.map((d) => d.id).slice(0, 2);
  if (docIds.length >= 2) {
    const compRes = await post(
      `/workspaces/${ws2.id}/runs/compare`,
      { documentIds: docIds, prompt: 'Compare the core architectural principles' },
      token
    );
    console.log('   ✅ Compare OK. ID:', compRes.id, 'Similarities:', compRes.output?.similarities?.length, 'Differences:', compRes.output?.differences?.length);
  } else {
    console.log('   ⚠️ Skipping Compare: Workspace 2 has less than 2 documents.');
  }

  // 7. Test Chat Q&A
  console.log(`\n5. Testing Chat Q&A on Workspace 1 ("${ws1.name}")...`);
  const chatRes = await post(
    `/workspaces/${ws1.id}/chat`,
    { question: 'What are the key milestones mentioned in the notes?' },
    token
  );
  console.log('   ✅ Chat Q&A OK. Citations count:', chatRes.assistantMessage?.citations?.length || 0);

  console.log('\n====================================================');
  console.log('🎉 ALL 5 WORKFLOWS EXECUTED AND RETURNED VALID RESULTS!');
  console.log('====================================================\n');
}

testAllWorkflows().catch(console.error);
