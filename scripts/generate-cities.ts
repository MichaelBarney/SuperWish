/**
 * Script to generate cities.json from SimpleMaps World Cities Database
 *
 * Usage:
 * 1. Download the free Basic version from https://simplemaps.com/data/world-cities
 * 2. Extract worldcities.csv to this scripts/ directory
 * 3. Run: npx tsx scripts/generate-cities.ts
 *
 * Options:
 *   --min-population=N  Minimum population filter (default: 15000)
 *   --output=PATH       Output file path (default: ./public/data/cities.json)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { resolve, dirname } from 'path'

// SimpleMaps CSV structure
interface SimpleMapsCity {
  city: string
  city_ascii: string
  lat: string
  lng: string
  country: string
  iso2: string
  iso3: string
  admin_name: string
  capital: string
  population: string
  id: string
}

// Output structure
interface City {
  name: string
  country: string
  countryCode: string
}

// Parse command line arguments
function parseArgs(): { minPopulation: number; outputPath: string } {
  const args = process.argv.slice(2)
  let minPopulation = 15000
  let outputPath = './public/data/cities.json'

  for (const arg of args) {
    if (arg.startsWith('--min-population=')) {
      minPopulation = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--output=')) {
      outputPath = arg.split('=')[1]
    }
  }

  return { minPopulation, outputPath }
}

function main() {
  const { minPopulation, outputPath } = parseArgs()
  const csvPath = resolve(dirname(new URL(import.meta.url).pathname), 'worldcities.csv')

  console.log('=== SimpleMaps Cities Generator ===\n')

  // Check if CSV file exists
  if (!existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`)
    console.error('\nPlease download the SimpleMaps World Cities Database:')
    console.error('1. Go to https://simplemaps.com/data/world-cities')
    console.error('2. Download the free "Basic" version')
    console.error('3. Extract worldcities.csv to the scripts/ directory')
    process.exit(1)
  }

  console.log(`Reading CSV from: ${csvPath}`)
  const csvContent = readFileSync(csvPath, 'utf-8')

  console.log('Parsing CSV...')
  const records: SimpleMapsCity[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  })

  console.log(`Total records in CSV: ${records.length}`)

  // Filter by population and transform
  console.log(`Filtering cities with population >= ${minPopulation}...`)

  const citiesWithPopulation = records
    .filter((r) => {
      const pop = parseInt(r.population, 10)
      return !isNaN(pop) && pop >= minPopulation
    })
    .map((r) => ({
      name: r.city,
      country: r.country,
      countryCode: r.iso2,
      population: parseInt(r.population, 10),
    }))
    .sort((a, b) => b.population - a.population) // Sort by population descending

  console.log(`Cities after population filter: ${citiesWithPopulation.length}`)

  // Remove duplicates (same name + country code)
  const seen = new Set<string>()
  const uniqueCities: City[] = []

  for (const city of citiesWithPopulation) {
    const key = `${city.name.toLowerCase()}-${city.countryCode}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueCities.push({
        name: city.name,
        country: city.country,
        countryCode: city.countryCode,
      })
    }
  }

  console.log(`Unique cities (after deduplication): ${uniqueCities.length}`)

  // Write output
  const outputFullPath = resolve(process.cwd(), outputPath)
  console.log(`\nWriting to: ${outputFullPath}`)

  writeFileSync(outputFullPath, JSON.stringify(uniqueCities, null, 2))

  // Calculate file size
  const stats = readFileSync(outputFullPath)
  const fileSizeKB = (stats.length / 1024).toFixed(2)

  console.log(`\n=== Done! ===`)
  console.log(`Generated ${uniqueCities.length} cities`)
  console.log(`File size: ${fileSizeKB} KB`)
  console.log(`\nTop 10 cities by population:`)
  uniqueCities.slice(0, 10).forEach((city, i) => {
    console.log(`  ${i + 1}. ${city.name}, ${city.country}`)
  })
}

main()
