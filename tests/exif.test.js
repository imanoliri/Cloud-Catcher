import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExifMetadata} from '../src/exif.js';

function buildMinimalExifJpeg(){
  const tiff=new Uint8Array(160);
  const view=new DataView(tiff.buffer);
  // Little-endian TIFF header "II", magic 42, IFD0 @ 8
  tiff[0]=0x49;tiff[1]=0x49;view.setUint16(2,42,true);view.setUint32(4,8,true);
  // IFD0: 2 entries (ExifIFDPointer @ 50, GPSInfoIFDPointer @ 90)
  view.setUint16(8,2,true);
  // Entry 0: 0x8769 ExifIFD
  view.setUint16(10,0x8769,true);view.setUint16(12,4,true);view.setUint32(14,1,true);view.setUint32(18,50,true);
  // Entry 1: 0x8825 GPSIFD
  view.setUint16(22,0x8825,true);view.setUint16(24,4,true);view.setUint32(26,1,true);view.setUint32(30,90,true);
  // Next IFD = 0
  view.setUint32(34,0,true);

  // ExifIFD @ 50: 1 entry DateTimeOriginal (0x9003), string len 20 @ 70
  view.setUint16(50,1,true);
  view.setUint16(52,0x9003,true);view.setUint16(54,2,true);view.setUint32(56,20,true);view.setUint32(60,70,true);
  const dt='2026:08:28 14:30:05\0';
  for(let i=0;i<dt.length;i++)tiff[70+i]=dt.charCodeAt(i);

  // GPSIFD @ 90: skipped minimal rational block? Wait let's encode N 43.3200deg = 43 deg 19 min 12 sec -> offset 130
  view.setUint16(90,2,true);
  // LatRef = 'N'
  view.setUint16(92,1,true);view.setUint16(94,2,true);view.setUint32(96,2,true);tiff[100]=0x4e;tiff[101]=0;
  // Lat 3 rationals @ 128
  view.setUint16(104,2,true);view.setUint16(106,5,true);view.setUint32(108,3,true);view.setUint32(112,128,true);
  view.setUint32(128,43,true);view.setUint32(132,1,true);
  view.setUint32(136,19,true);view.setUint32(140,1,true);
  view.setUint32(144,12,true);view.setUint32(148,1,true);

  const app1Len=2+6+tiff.length;
  const jpeg=new Uint8Array(2+4+6+tiff.length+2);
  const jv=new DataView(jpeg.buffer);
  jpeg[0]=0xff;jpeg[1]=0xd8;
  jpeg[2]=0xff;jpeg[3]=0xe1;
  jv.setUint16(4,app1Len,false);
  'Exif\0\0'.split('').forEach((ch,i)=>{jpeg[6+i]=ch.charCodeAt(0)});
  jpeg.set(tiff,12);
  jpeg[jpeg.length-2]=0xff;jpeg[jpeg.length-1]=0xd9;
  return jpeg.buffer;
}

test('parseExifMetadata returns empty object for non-jpeg buffers',()=>{
  assert.deepEqual(parseExifMetadata(new Uint8Array([1,2,3]).buffer),{});
  assert.deepEqual(parseExifMetadata(null),{});
});

test('parseExifMetadata extracts DateTimeOriginal from JPEG APP1 EXIF',()=>{
  const meta=parseExifMetadata(buildMinimalExifJpeg());
  assert.equal(meta.observedAt,'2026-08-28T14:30:05Z');
});
