#!/usr/bin/env node
// Generates icon-192.png and icon-512.png using pure Node.js (no native deps)
// Run: node scripts/generate-icons.js

import { createDeflateRaw } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { promisify } from 'util'

const deflateRaw = promisify(createDeflateRaw)

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

// CRC32 table
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4)
  b.writeUInt32BE(n >>> 0, 0)
  return b
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const crc = crc32(Buffer.concat([typeBytes, dataBytes]))
  return Buffer.concat([uint32BE(dataBytes.length), typeBytes, dataBytes, uint32BE(crc)])
}

async function generatePNG(size) {
  // Create RGBA pixel buffer (size × size × 4 bytes)
  const pixels = Buffer.alloc(size * size * 4)

  const cx = size / 2
  const cy = size / 2

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Background: #0f172a (dark navy)
      let r = 0x0f, g = 0x17, b = 0x2a, a = 255

      // Outer ring: radius range [0.36*size .. 0.43*size] — blue arc
      const innerR = size * 0.36
      const outerR = size * 0.43
      const inRing = dist >= innerR && dist <= outerR

      if (inRing) {
        // Angle from top (-90°)
        const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
        const normAngle = ((angle % 360) + 360) % 360
        if (normAngle < 270) {
          // arc fill — blue-400 #60a5fa
          r = 0x60; g = 0xa5; b = 0xfa
        } else {
          // track — slate #334155
          r = 0x33; g = 0x41; b = 0x55
        }
      }

      // Lightning bolt (simplified: just a slash line)
      // Center bolt as a simple diamond/rhombus
      const boltW = size * 0.08
      const boltH = size * 0.28
      const bx = dx / boltW
      const by = dy / boltH

      // Upper half of bolt (tilted right)
      if (dy < 0 && dy > -boltH && Math.abs(dx - (-dy * 0.15)) < boltW * 0.8) {
        r = 0xe2; g = 0xe8; b = 0xf0
      }
      // Lower half of bolt (tilted right)
      if (dy >= 0 && dy < boltH && Math.abs(dx - (dy * 0.15)) < boltW * 0.8) {
        r = 0xe2; g = 0xe8; b = 0xf0
      }

      pixels[idx]     = r
      pixels[idx + 1] = g
      pixels[idx + 2] = b
      pixels[idx + 3] = a
    }
  }

  // Build PNG scanlines: filter byte (0) + row data
  // PNG filter type 0 = None
  const scanlines = []
  for (let y = 0; y < size; y++) {
    scanlines.push(Buffer.from([0]))  // filter byte
    scanlines.push(pixels.subarray(y * size * 4, (y + 1) * size * 4))
  }
  const rawData = Buffer.concat(scanlines)

  // Compress
  const compressed = await new Promise((resolve, reject) => {
    const chunks = []
    const deflate = createDeflateRaw({ level: 6 })
    deflate.on('data', (c) => chunks.push(c))
    deflate.on('end', () => resolve(Buffer.concat(chunks)))
    deflate.on('error', reject)
    deflate.end(rawData)
  })

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR: width, height, bitDepth=8, colorType=6(RGBA), compress=0, filter=0, interlace=0
  const ihdr = Buffer.concat([
    uint32BE(size), uint32BE(size),
    Buffer.from([8, 6, 0, 0, 0])
  ])

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const buf = await generatePNG(size)
  const outPath = join(outDir, `icon-${size}.png`)
  writeFileSync(outPath, buf)
  console.log(`✓ Generated ${outPath} (${buf.length} bytes)`)
}
