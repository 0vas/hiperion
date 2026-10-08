import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { z } from 'zod';
import { WorkflowError, type Principal } from '../domain/workflow.js';
import type { Store } from './store.js';

type Options = {
  store: Store;
  agentToken: string;
  humanToken: string;
  agentId: string;
  publicDir?: string;
  getAgentTokens?: () => Record<string, string>;
};
const createSchema = z
  .object({ plan: z.unknown(), commandId: z.string().min(1).max(128) })
  .strict();
const equal = (a: string, b: string) =>
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}
async function body(req: IncomingMessage) {
  if (!req.headers['content-type']?.startsWith('application/json'))
    throw new WorkflowError('CONTENT_TYPE', 'Use application/json', 415);
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 128 * 1024)
      throw new WorkflowError('TOO_LARGE', 'Request exceeds 128 KiB', 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new WorkflowError('INVALID_JSON', 'Invalid JSON', 400);
  }
}
export function createApp(options: Options) {
  let baseUrl = '';
  const server = createServer(async (req, res) => {
    res.setHeader('cache-control', 'no-store');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    res.setHeader(
      'content-security-policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    try {
      const actual = new URL(baseUrl);
      // Exact authority protects the loopback service against DNS rebinding.
      if (req.headers.host !== actual.host)
        throw new WorkflowError('HOST_DENIED', 'Untrusted Host', 403);
      if (req.headers.origin && req.headers.origin !== baseUrl)
        throw new WorkflowError(
          'ORIGIN_DENIED',
          'Cross-origin requests are not accepted',
          403,
        );
      if (req.headers['sec-fetch-site'] === 'cross-site')
        throw new WorkflowError(
          'ORIGIN_DENIED',
          'Cross-site requests are not accepted',
          403,
        );
      const url = new URL(req.url || '/', baseUrl);
      if (url.pathname === '/api/health' && req.method === 'GET') {
        json(res, 200, { ok: true, version: '0.1.0' });
        return;
      }
      if (url.pathname === '/api/session' && req.method === 'GET') {
        res.setHeader(
          'set-cookie',
          `hyperion_session=${options.humanToken}; HttpOnly; SameSite=Strict; Path=/`,
        );
        json(res, 200, { role: 'human' });
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        const bearer = req.headers.authorization?.replace(/^Bearer /, '') || '';
        const cookie =
          req.headers.cookie
            ?.split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith('hyperion_session='))
            ?.slice('hyperion_session='.length) || '';
        const agents = options.getAgentTokens?.() || {
          [options.agentId]: options.agentToken,
        };
        const agent = Object.entries(agents).find(([, token]) =>
          equal(bearer, token),
        );
        let actor: Principal;
        if (agent) actor = { role: 'agent', id: agent[0] };
        else if (
          equal(bearer, options.humanToken) ||
          equal(cookie, options.humanToken)
        )
          actor = { role: 'human', id: 'local-user' };
        else
          throw new WorkflowError(
            'UNAUTHORIZED',
            'Authentication required',
            401,
          );
        if (url.pathname === '/api/runs' && req.method === 'GET') {
          json(res, 200, options.store.list());
          return;
        }
        if (url.pathname === '/api/runs' && req.method === 'POST') {
          const data = createSchema.parse(await body(req));
          json(
            res,
            201,
            options.store.create(data.plan, actor, data.commandId),
          );
          return;
        }
        const match = /^\/api\/runs\/([a-f0-9-]+)(\/commands)?$/.exec(
          url.pathname,
        );
        if (match) {
          const id = match[1]!;
          if (!match[2] && req.method === 'GET') {
            json(res, 200, options.store.get(id));
            return;
          }
          if (match[2] && req.method === 'POST') {
            const data = await body(req);
            if (
              actor.role === 'human' &&
              (!data ||
                typeof data !== 'object' ||
                !('expectedRevision' in data))
            )
              throw new WorkflowError(
                'REVISION_REQUIRED',
                'Human decisions require expectedRevision',
                400,
              );
            json(res, 200, options.store.command(id, data, actor));
            return;
          }
        }
        throw new WorkflowError('NOT_FOUND', 'API route not found', 404);
      }
      if (req.method !== 'GET' && req.method !== 'HEAD')
        throw new WorkflowError(
          'METHOD_NOT_ALLOWED',
          'Method not allowed',
          405,
        );
      const root = resolve(options.publicDir || 'dist/client');
      const filename =
        url.pathname === '/'
          ? 'index.html'
          : decodeURIComponent(url.pathname).slice(1);
      const file = resolve(root, filename);
      if (!file.startsWith(root + sep))
        throw new WorkflowError('NOT_FOUND', 'Not found', 404);
      const content = await readFile(file).catch(() => {
        throw new WorkflowError(
          'NOT_FOUND',
          'Build the UI with npm run build',
          404,
        );
      });
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
      };
      if (filename === 'index.html')
        res.setHeader(
          'set-cookie',
          `hyperion_session=${options.humanToken}; HttpOnly; SameSite=Strict; Path=/`,
        );
      res.writeHead(200, {
        'content-type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8`,
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (error instanceof z.ZodError) {
        json(res, 400, {
          error: 'VALIDATION',
          message: error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; '),
        });
        return;
      }
      if (error instanceof WorkflowError) {
        json(res, error.status, { error: error.code, message: error.message });
        return;
      }
      console.error('Hyperion request failed:', error);
      json(res, 500, { error: 'INTERNAL', message: 'Unexpected server error' });
    }
  });
  server.requestTimeout = 15000;
  return {
    listen(port: number): Promise<string> {
      return new Promise((done, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
          const address = server.address();
          if (!address || typeof address === 'string') {
            reject(new Error('Invalid server address'));
            return;
          }
          baseUrl = `http://127.0.0.1:${address.port}`;
          done(baseUrl);
        });
      });
    },
    close(): Promise<void> {
      return new Promise((done, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : done()));
      });
    },
  };
}
