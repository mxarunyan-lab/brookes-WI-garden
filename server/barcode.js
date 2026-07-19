import sharp from 'sharp';
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';

const digits = (value) => String(value || '').replace(/\D/g, '');
const zxingFormats = [BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.EAN_8, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128];
const formatName = (format) => ({
  [BarcodeFormat.UPC_A]: 'UPC-A',
  [BarcodeFormat.UPC_E]: 'UPC-E',
  [BarcodeFormat.EAN_8]: 'EAN-8',
  [BarcodeFormat.EAN_13]: 'EAN-13',
  [BarcodeFormat.CODE_128]: 'CODE-128',
}[format] || 'unknown');

export function validateBarcode(value, suppliedFormat = null) {
  const raw = String(value || '').trim();
  const code = digits(raw);
  const normalizedFormat = suppliedFormat || (code.length === 12 ? 'UPC-A' : code.length === 13 ? 'EAN-13' : code.length === 8 ? 'EAN-8' : raw ? 'CODE-128' : null);
  if (normalizedFormat === 'CODE-128') return {value: raw, format: 'CODE-128', checkDigitValid: null};
  if (![8, 12, 13, 14].includes(code.length)) return {value: code, format: normalizedFormat, checkDigitValid: false};
  let sum = 0;
  const parity = code.length % 2;
  for (let index = 0; index < code.length - 1; index += 1) sum += Number(code[index]) * (index % 2 === parity ? 3 : 1);
  const checkDigitValid = (10 - (sum % 10)) % 10 === Number(code.at(-1));
  return {value: code, format: normalizedFormat, checkDigitValid};
}

async function decodeVariant(buffer, transform) {
  let pipeline = sharp(buffer, {failOn: 'warning', limitInputPixels: 50_000_000}).flatten({background: '#fff'}).rotate();
  if (transform.crop) {
    const metadata = await pipeline.metadata();
    const left = Math.max(0, Math.floor((metadata.width || 1) * (transform.crop.left || 0)));
    const top = Math.max(0, Math.floor((metadata.height || 1) * (transform.crop.top || 0)));
    const width = Math.max(1, Math.min((metadata.width || 1) - left, Math.floor((metadata.width || 1) * (transform.crop.width || 1))));
    const height = Math.max(1, Math.min((metadata.height || 1) - top, Math.floor((metadata.height || 1) * (transform.crop.height || 1))));
    pipeline = pipeline.extract({left, top, width, height});
  }
  if (transform.resize) pipeline = pipeline.resize({width: transform.resize, fit: 'inside', withoutEnlargement: false});
  if (transform.sharpen) pipeline = pipeline.sharpen();
  pipeline = pipeline.grayscale();
  if (transform.threshold) pipeline = pipeline.threshold(transform.threshold);
  const {data, info} = await pipeline.raw().toBuffer({resolveWithObject: true});
  const source = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
  for (const Binarizer of [HybridBinarizer, GlobalHistogramBinarizer]) {
    const bitmap = new BinaryBitmap(new Binarizer(source));
    const reader = new MultiFormatReader();
    reader.setHints(new Map([
      [DecodeHintType.POSSIBLE_FORMATS, zxingFormats],
      [DecodeHintType.TRY_HARDER, true],
    ]));
    try {
      const result = reader.decode(bitmap);
      return {value: result.getText(), zxingFormat: result.getBarcodeFormat()};
    } catch {
      // Try the next binarizer or image treatment.
    } finally {
      reader.reset();
    }
  }
  return null;
}

export async function decodeBarcode(buffer) {
  const variants = [
    {},
    {sharpen: true},
    {threshold: 185},
    {resize: 3200, sharpen: true},
    {resize: 3200, threshold: 180},
    {crop: {top: 0.45, height: 0.55}, resize: 2800, sharpen: true},
    {crop: {top: 0.62, height: 0.38}, resize: 2800},
    {crop: {left: 0.08, top: 0.58, width: 0.84, height: 0.4}, resize: 3000, sharpen: true},
  ];
  for (const transform of variants) {
    const decoded = await decodeVariant(buffer, transform).catch(() => null);
    if (!decoded) continue;
    const format = formatName(decoded.zxingFormat);
    const checked = validateBarcode(decoded.value, format);
    if (checked.checkDigitValid === false && format !== 'CODE-128') continue;
    return {
      value: checked.value,
      format,
      confidence: checked.checkDigitValid === true ? 'high' : 'medium',
      method: 'machine-decoder',
      checkDigitValid: checked.checkDigitValid,
      visibleDigits: checked.value,
    };
  }
  return {value: null, format: null, confidence: null, method: 'unavailable', checkDigitValid: null, visibleDigits: null};
}
