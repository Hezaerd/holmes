import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { Service } from '../types';

const SERVICES_PATH = resolve(__dirname, '../lib/fetcher/services.json');

try {
  // Read the services file
  const servicesFile = readFileSync(SERVICES_PATH, 'utf-8');
  const services: Service[] = JSON.parse(servicesFile);

  // Sort services alphabetically by name
  const sortedServices = services.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  // Write the sorted services back to the file with proper formatting
  writeFileSync(
    SERVICES_PATH,
    JSON.stringify(sortedServices, null, 2) + '\n',
    'utf-8'
  );

  console.log('✅ Services have been sorted successfully!');
  console.log(`📝 Total services: ${services.length}`);
} catch (error) {
  console.error('❌ Error sorting services:', error);
  process.exit(1);
}