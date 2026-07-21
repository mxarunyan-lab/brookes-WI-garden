import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import compression from 'compression';
import express from 'express';
import helmet from 'helmet';
import {analyzeSeedPacket} from './seedPacketVision.js';
import {configuredResearchProviders} from './productResearch.js';

const port = Number(process.env.PORT || 3000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const buckets = new Map();
const cache = new Map();
const CACHE_TTL_MS = 30 * 60_000;

const hashPacketPayload = (frontImage, backImage) => crypto.createHash('sha256').update(String(frontImage)).update('\0').update(String(backImage)).digest('hex');

function rateLimit(req, res, next) {
  const key = req.get('x-device-id') || req.ip || 'unknown';
  const now = Date.now();
  const rows = (buckets.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
  if (rows.length >= 4) return res.status(429).json({code: 'RATE_LIMITED', message: 'Packet analysis is busy. Try again shortly.', requestId: crypto.randomUUID()});
  rows.push(now);
  buckets.set(key, rows);
  next();
}

const publicMessage = (code, status) => {
  if (code === 'BOTH_IMAGES_REQUIRED') return 'Add both packet photos before analysis.';
  if (code === 'IMAGE_TOO_LARGE' || code === 'IMAGE_DIMENSIONS_TOO_LARGE') return 'One packet photo is too large. Replace it with a smaller image.';
  if (code === 'INVALID_IMAGE' || code === 'UNSUPPORTED_IMAGE') return 'One packet photo could not be read. Replace that photo and try again.';
  if (code === 'MODEL_REFUSAL') return 'The packet analysis could not be completed from these photos. Your photos and draft remain saved.';
  if (code === 'UPSTREAM_TIMEOUT' || status === 504) return 'Packet analysis did not finish. Your photos and draft remain saved.';
  if (status === 503) return 'Online packet analysis is temporarily unavailable. Your photos and draft remain saved.';
  return 'Packet analysis could not finish. Your photos and draft remain saved.';
};

export function createApp({analyze = analyzeSeedPacket} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({contentSecurityPolicy: false, crossOriginEmbedderPolicy: false}));
  app.use(compression());
  app.use(express.json({limit: process.env.SEED_PACKET_REQUEST_LIMIT || '24mb'}));

  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (req, res) => res.json({
    ok: true,
    service: 'runyan-garden',
    packetVisionConfigured: Boolean(process.env.OPENAI_API_KEY),
    packetVisionModel: process.env.SEED_PACKET_VISION_MODEL || 'gpt-5-mini',
    productResearchProviders: configuredResearchProviders(),
    version: process.env.APP_VERSION || '0.20.3',
  }));

  app.post('/api/seed-packets/analyze', rateLimit, async (req, res) => {
    const requestId = crypto.randomUUID();
    try {
      const {frontImage, backImage, draftContext} = req.body || {};
      if (!frontImage || !backImage) return res.status(400).json({code: 'BOTH_IMAGES_REQUIRED', message: publicMessage('BOTH_IMAGES_REQUIRED', 400), requestId});
      const cacheKey = `${process.env.SEED_PACKET_VISION_MODEL || 'gpt-5-mini'}:${hashPacketPayload(frontImage, backImage)}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return res.json({...cached.result, cacheHit: true});
      const result = await analyze({frontImage, backImage, draftContext}, {requestId});
      cache.set(cacheKey, {result, cachedAt: Date.now()});
      const timer = setTimeout(() => cache.delete(cacheKey), CACHE_TTL_MS);
      timer.unref?.();
      return res.json({...result, cacheHit: false});
    } catch (error) {
      const status = Number(error.status) || (error.code === 'VISION_NOT_CONFIGURED' ? 503 : 502);
      console.error('[seed-packet-vision]', {
        requestId,
        code: error.code || 'ANALYSIS_FAILED',
        message: error.message,
        upstreamStatus: error.upstreamStatus || null,
        upstreamCode: error.upstreamCode || null,
        upstreamType: error.upstreamType || null,
        upstreamMessage: error.upstreamMessage || null,
        validationErrors: error.validationErrors || null,
      });
      return res.status(status).json({code: error.code || 'ANALYSIS_FAILED', message: publicMessage(error.code, status), requestId});
    }
  });

  app.use('/api', (req, res) => res.status(404).json({code: 'NOT_FOUND', message: 'API route not found.'}));
  app.use(express.static(root, {index: false, maxAge: '1h'}));
  app.use((req, res) => res.sendFile(path.join(root, 'index.html')));
  return app;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) createApp().listen(port, () => console.log(`Runyan Garden web service listening on ${port}`));
