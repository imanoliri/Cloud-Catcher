// Zero-dependency JPEG APP1 EXIF timestamp and GPS parser.

function ascii(view, start, length) {
  let out = '';
  for (let i = 0; i < length && start + i < view.byteLength; i++) {
    const code = view.getUint8(start + i);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out;
}

function readRational(view, offset, littleEndian) {
  if (offset + 8 > view.byteLength) return null;
  const num = view.getUint32(offset, littleEndian);
  const den = view.getUint32(offset + 4, littleEndian);
  if (!den) return null;
  return num / den;
}

function readIfdEntries(view, tiffStart, ifdOffset, littleEndian) {
  const abs = tiffStart + ifdOffset;
  if (abs + 2 > view.byteLength) return [];
  const count = view.getUint16(abs, littleEndian);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const base = abs + 2 + i * 12;
    if (base + 12 > view.byteLength) break;
    entries.push({
      tag: view.getUint16(base, littleEndian),
      type: view.getUint16(base + 2, littleEndian),
      count: view.getUint32(base + 4, littleEndian),
      valueOffset: base + 8,
      rawValue: view.getUint32(base + 8, littleEndian),
    });
  }
  return entries;
}

function readAsciiTag(view, tiffStart, entry) {
  if (!entry || entry.type !== 2 || entry.count === 0) return '';
  const start = entry.count <= 4 ? entry.valueOffset : tiffStart + entry.rawValue;
  return ascii(view, start, entry.count).trim();
}

function parseExifDate(raw) {
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(String(raw || '').trim());
  if (!match) return '';
  const [, y, m, d, hh, mm, ss] = match;
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  return Number.isNaN(Date.parse(iso)) ? '' : iso;
}

function dmsToDecimal(view, offset, littleEndian, ref) {
  const deg = readRational(view, offset, littleEndian);
  const min = readRational(view, offset + 8, littleEndian);
  const sec = readRational(view, offset + 16, littleEndian);
  if (deg == null || min == null || sec == null) return null;
  let dec = deg + min / 60 + sec / 3600;
  if (ref === 'S' || ref === 'W') dec = -dec;
  return Math.round(dec * 10000) / 10000;
}

export function parseExifMetadata(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12) return {};
  const view = new DataView(buffer);
  if (view.getUint16(0, false) !== 0xffd8) return {};

  let pos = 2;
  while (pos + 4 <= view.byteLength) {
    if (view.getUint8(pos) !== 0xff) break;
    const marker = view.getUint8(pos + 1);
    if (marker === 0xda || marker === 0xd9) break;
    const len = view.getUint16(pos + 2, false);
    if (len < 2 || pos + 2 + len > view.byteLength) break;
    if (marker === 0xe1 && ascii(view, pos + 4, 6) === 'Exif') {
      const tiffStart = pos + 10;
      if (tiffStart + 8 > view.byteLength) return {};
      const order = ascii(view, tiffStart, 2);
      const littleEndian = order === 'II';
      if (!littleEndian && order !== 'MM') return {};
      const firstIfd = view.getUint32(tiffStart + 4, littleEndian);
      const ifd0 = readIfdEntries(view, tiffStart, firstIfd, littleEndian);

      let observedAt = '';
      let gps = null;
      const dt0 = ifd0.find(e => e.tag === 0x0132);
      if (dt0) observedAt = parseExifDate(readAsciiTag(view, tiffStart, dt0));

      const exifPtr = ifd0.find(e => e.tag === 0x8769);
      if (exifPtr) {
        const exifIfd = readIfdEntries(view, tiffStart, exifPtr.rawValue, littleEndian);
        const dto = exifIfd.find(e => e.tag === 0x9003) || exifIfd.find(e => e.tag === 0x9004);
        const parsed = dto ? parseExifDate(readAsciiTag(view, tiffStart, dto)) : '';
        if (parsed) observedAt = parsed;
      }

      const gpsPtr = ifd0.find(e => e.tag === 0x8825);
      if (gpsPtr) {
        const gpsIfd = readIfdEntries(view, tiffStart, gpsPtr.rawValue, littleEndian);
        const latRef = readAsciiTag(view, tiffStart, gpsIfd.find(e => e.tag === 1));
        const latEntry = gpsIfd.find(e => e.tag === 2);
        const lonRef = readAsciiTag(view, tiffStart, gpsIfd.find(e => e.tag === 3));
        const lonEntry = gpsIfd.find(e => e.tag === 4);
        if (latEntry && lonEntry && latEntry.count >= 3 && lonEntry.count >= 3) {
          const lat = dmsToDecimal(view, tiffStart + latEntry.rawValue, littleEndian, latRef);
          const lon = dmsToDecimal(view, tiffStart + lonEntry.rawValue, littleEndian, lonRef);
          if (lat != null && lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
            gps = { lat, lon };
          }
        }
      }
      return { ...(observedAt ? { observedAt } : {}), ...(gps ? { gps } : {}) };
    }
    pos += 2 + len;
  }
  return {};
}
