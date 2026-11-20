import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configuration } from './config.js';
import { createFlagStore } from './flags.js';
import {
  createAdminAuthentication,
  handleError,
  requireSameOrigin,
  setResponseHeaders
} from './middleware.js';
import { calculateQuote, isValidQuantity } from './pricing.js';

export { booleanSetting, configuration } from './config.js';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
const panelDirectory = fileURLToPath(new URL('../public/flags/', import.meta.url));

export function createApp(config = configuration()) {
  const app = express();
  const flags = createFlagStore({
    environment: config.environment,
    filename: config.flagsFile,
    bulkDiscount: config.bulkDiscount
  });
  const requireAdmin = createAdminAuthentication(config.adminPassword);

  app.disable('x-powered-by');
  app.use(express.json({ limit: '8kb' }));
  app.use(setResponseHeaders);

  app.get('/', (_req, res) => {
    res.sendFile('index.html', { root: publicDirectory });
  });
  app.get('/home.css', (_req, res) => {
    res.sendFile('home.css', { root: publicDirectory });
  });
  app.get('/home.js', (_req, res) => {
    res.sendFile('home.js', { root: publicDirectory });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', environment: config.environment });
  });

  app.get('/version', (_req, res) => {
    const snapshot = flags.snapshot();
    res.json({
      application: 'trunk-based-development-lab',
      version: packageJson.version,
      environment: config.environment,
      commitSha: config.commitSha,
      releaseIdentity: config.releaseIdentity,
      imageDigest: config.imageDigest,
      buildRunId: config.buildRunId,
      features: { bulkDiscount: false, ...snapshot.flags },
      flagRevision: snapshot.revision,
      configurationId: snapshot.configurationId,
      demoFault: config.demoFault,
      metadataNotice: 'Runtime declarations only. Deployment gates must verify GitHub and registry evidence.'
    });
  });

  app.get('/api/features', (_req, res) => {
    res.json({ bulkDiscount: false, ...flags.snapshot().flags });
  });

  app.post('/api/quote', (req, res) => {
    const quantity = req.body?.quantity;
    if (!isValidQuantity(quantity)) {
      return res.status(400).json({
        error: 'quantity must be an integer between 1 and 100'
      });
    }

    const bulkDiscount = flags.snapshot().flags.bulkDiscount === true;
    res.json(calculateQuote(quantity, { bulkDiscount, demoFault: config.demoFault }));
  });

  app.get('/flags', requireAdmin, (_req, res) => {
    res.sendFile('index.html', { root: panelDirectory });
  });
  app.get('/flags/panel.js', requireAdmin, (_req, res) => {
    res.sendFile('panel.js', { root: panelDirectory });
  });
  app.get('/flags/panel.css', requireAdmin, (_req, res) => {
    res.sendFile('panel.css', { root: panelDirectory });
  });

  app.get('/api/admin/flags', requireAdmin, (_req, res) => {
    res.json(flags.snapshot());
  });
  app.put('/api/admin/flags/:name', requireAdmin, requireSameOrigin, (req, res) => {
    const name = req.params.name;
    const enabled = req.body?.enabled;
    const expectedRevision = req.get('If-Match');
    res.json(flags.set(name, enabled, expectedRevision));
  });
  app.delete('/api/admin/flags/:name', requireAdmin, requireSameOrigin, (req, res) => {
    res.json(flags.remove(req.params.name, req.get('If-Match')));
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(handleError);

  return app;
}
