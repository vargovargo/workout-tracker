#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import FitParser from 'fit-file-parser'

const DIR = resolve(process.argv[2] || 'data/coros')
const files = readdirSync(DIR).filter((f) => f.endsWith('.fit'))

for (const file of files) {
  const buf = readFileSync(resolve(DIR, file))
  const parser = new FitParser({ force: true, speedUnit: 'km/h', lengthUnit: 'km' })
  parser.parse(buf, (err, data) => {
    if (err) { console.log(`\n${file}: ERROR — ${err.message}`); return }
    console.log(`\n=== ${file} ===`)
    console.log('top-level keys:', Object.keys(data))
    if (data.activity) console.log('activity keys:', Object.keys(data.activity))
    // Print everything non-records to avoid flooding
    const stripped = JSON.parse(JSON.stringify(data, (k, v) =>
      k === 'records' ? `[${Array.isArray(v) ? v.length : 0} records]` : v
    ))
    console.log(JSON.stringify(stripped, null, 2).slice(0, 3000))
  })
}
