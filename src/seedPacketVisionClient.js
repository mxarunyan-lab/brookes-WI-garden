const DEVICE_KEY = 'runyan-seed-vision-device-v1';
const FRONTEND_TIMEOUT_MS = 110_000;

const deviceId = () => {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

export async function hashPacketPhotos(front, back) {
  const bytes = new TextEncoder().encode(`${front}\u0000${back}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

export async function getSeedVisionHealth() {
  const response = await fetch('/api/health', {headers: {Accept: 'application/json'}, cache: 'no-store'});
  if (!response.ok) throw new Error('health unavailable');
  return response.json();
}

export async function analyzePacketPhotos({frontImage, backImage, draftContext, signal}) {
  const photoFingerprint = await hashPacketPhotos(frontImage, backImage);
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);
  signal?.addEventListener?.('abort', abortFromCaller, {once: true});
  const timer = setTimeout(() => controller.abort(new DOMException('Packet analysis timed out', 'TimeoutError')), FRONTEND_TIMEOUT_MS);
  try {
    const response = await fetch('/api/seed-packets/analyze', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Device-Id': deviceId()},
      body: JSON.stringify({frontImage, backImage, draftContext, photoFingerprint}),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.message || 'Packet analysis could not finish. Your photos and draft remain saved.');
      error.code = body.code;
      error.requestId = body.requestId;
      error.status = response.status;
      throw error;
    }
    return body;
  } catch (error) {
    if (controller.signal.aborted && !error.code) {
      const timeoutError = new Error('Packet analysis did not finish. Your photos and draft remain saved.');
      timeoutError.code = 'CLIENT_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', abortFromCaller);
  }
}
