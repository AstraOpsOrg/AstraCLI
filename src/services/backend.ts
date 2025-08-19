import { requiredEnv } from '@/src/utils/config.ts';
import { appendFileSync } from 'node:fs';

// Reusable SSE helpers
async function iterateSSE(
  stream: ReadableStream<any>,
  onChunk: (chunk: string) => boolean | Promise<boolean> | void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const stop = await onChunk(chunk);
      if (stop) return;
    }
  }
}

function parseSSEChunk(chunk: string): { event?: string; data: string } | null {
  const lines = chunk.split('\n');
  let event: string | undefined;
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return null;
  return { event, data };
}

export async function postDeployRequest(request: any, opts?: { simulate?: boolean }): Promise<{ jobId: string }> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const endpoint = opts?.simulate ? '/v1/deploy/simulate' : '/v1/deploy';
  const res = await fetch(`${apiUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Deploy request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return (await res.json()) as { jobId: string };
}

export async function streamLogs(
  jobId: string,
  opts?: { type?: 'deploy' | 'destroy'; appName?: string }
): Promise<void> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const type = opts?.type === 'destroy' ? 'destroy' : 'deploy';
  const url = `${apiUrl}/v1/${type}/${jobId}/logs`;
  const res = await fetch(url, { method: 'GET', headers: { Authorization: apiKey } });
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`SSE connection failed: ${res.status} ${res.statusText} - ${text}`);
  }

  await iterateSSE(res.body, (chunk) => {
    const encounteredError = handleSSEChunk(chunk, type === 'destroy', opts?.appName);
    if (encounteredError && type === 'destroy') {
      throw new Error('Destroy failed');
    }
  });
}

export async function getJobStatus(jobId: string): Promise<'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const res = await fetch(`${apiUrl}/v1/deploy/${jobId}/status`, { method: 'GET', headers: { Authorization: apiKey } });
  if (!res.ok) throw new Error(`Failed to get job status: ${res.status}`);
  const data = await res.json();
  return data.status;
}

export async function setupMonitoring(jobId: string): Promise<{ url: string; username?: string; password?: string }> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const res = await fetch(`${apiUrl}/v1/deploy/${jobId}/monitoring`, { method: 'POST', headers: { Authorization: apiKey } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Monitoring setup failed: ${res.status} ${text}`);
  }
  const data = await res.json() as { url: string; username?: string; password?: string };
  // Capture Monitoring URL and publish to github summary output
  try {
    const ghaSummary = Bun.env.GITHUB_STEP_SUMMARY;
    if (ghaSummary && data?.url) {
      appendFileSync(ghaSummary, `## Monitoring Dashboard URL\n\n${data.url}\n`);
    }
  } catch {}
  return data;
}

export async function postDestroyRequest(request: any): Promise<{ jobId: string }> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const res = await fetch(`${apiUrl}/v1/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Destroy request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return (await res.json()) as { jobId: string };
}

export async function streamMonitoringLogs(jobId: string): Promise<() => Promise<void>> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const url = `${apiUrl}/v1/deploy/${jobId}/monitoring/logs`;
  const controller = new AbortController();
  const res = await fetch(url, { method: 'GET', headers: { Authorization: apiKey }, signal: controller.signal });
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`SSE (monitoring) failed: ${res.status} ${res.statusText} - ${text}`);
  }

  let active = true;
  (async () => {
    try {
  await iterateSSE(res.body!, (chunk) => {
        if (!active) return true;
        const parsed = parseSSEChunk(chunk);
        if (parsed && parsed.event === 'raw') console.log(parsed.data);
      });
    } catch (_) {}
  })();

  return async () => {
    active = false;
    try { controller.abort(); } catch {}
  };
}

export async function streamDestroyLogs(jobId: string): Promise<() => Promise<void>> {
  const apiUrl = requiredEnv('ASTRAOPS_API_URL');
  const apiKey = requiredEnv('ASTRAOPS_API_KEY');
  const url = `${apiUrl}/v1/destroy/${jobId}/destroy/logs`;
  const controller = new AbortController();
  const res = await fetch(url, { method: 'GET', headers: { Authorization: apiKey }, signal: controller.signal });
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`SSE (destroy) failed: ${res.status} ${res.statusText} - ${text}`);
  }

  let active = true;
  (async () => {
    try {
  await iterateSSE(res.body!, (chunk) => {
        if (!active) return true;
        const parsed = parseSSEChunk(chunk);
        if (parsed && parsed.event === 'raw') console.log(parsed.data);
      });
    } catch (_) {}
  })();

  return async () => {
    active = false;
    try { controller.abort(); } catch {}
  };
}

function handleSSEChunk(chunk: string, breakOnError = false, appName?: string): boolean {
  const lines = chunk.split('\n');
  let event: string | undefined;
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data) return false;
  if (event === 'log') {
    try {
      const parsed = JSON.parse(data);
      const phase = parsed.phase || 'unknown';
      const level = parsed.level || 'info';
      const message = parsed.message || '';
      const ts = parsed.timestamp ? `[${parsed.timestamp}] ` : '';
      const line = `${ts}[${phase}] ${message}`;
      
      // Capture Frontend URL and publish to github summary output
      if (typeof message === 'string' && /Frontend public URL:\s*http/i.test(message)) {
        const match = message.match(/Frontend public URL:\s*(https?:\/\/\S+)/i);
        const url = match?.[1] || '';
        if (url) {
          import('@/src/utils/theme.ts').then(({ default: theme }) => {
            console.log(theme.greenCustom(`✅ Frontend ready: ${url}`));
          }).catch(() => {
            console.log(`✅ Frontend ready: ${url}`);
          });
          try {
            const ghaSummary = Bun.env.GITHUB_STEP_SUMMARY;
            if (ghaSummary) {
              const heading = appName ? `${appName} Frontend URL` : 'Frontend URL';
              appendFileSync(ghaSummary, `## ${heading}\n\n${url}\n`);
            }
          } catch {}
        }
        return false;
      }
      
      if (typeof message === 'string' && /S3 bucket.*removed successfully/i.test(message)) {
        import('@/src/utils/theme.ts').then(({ default: theme }) => {
          console.log(theme.greenCustom(`✅ Destroy completed successfully`));
        }).catch(() => {
          console.log(`✅ Destroy completed successfully`);
        });
        return false;
      }
      
      if (level === 'success') console.log(line);
      else if (level === 'error' || level === 'failed') console.error(line);
      else console.log(line);
      
      if (breakOnError && (level === 'error' || level === 'failed')) {
        return true;
      }
    } catch {
      console.log(data);
    }
  } else if (event === 'raw') {
    console.log(data);
  } else {
    console.log(data);
  }
  return false;
}


