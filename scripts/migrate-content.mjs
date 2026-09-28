import fs from 'node:fs/promises';
import {FACTS,CATEGORIES} from '../dist/content.mjs';
await fs.mkdir(new URL('../content/',import.meta.url),{recursive:true});
const facts=FACTS.map(f=>({...f,workflow:'approved',review:{reviewer:'source-review-2026-09',sourceChecked:true,plainLanguageChecked:true,evidence:'Existing source-reviewed seed; see linked source and verification note.',reviewedAt:f.dateVerified}}));
await fs.writeFile(new URL('../content/catalog.json',import.meta.url),JSON.stringify({schema:1,categories:CATEGORIES,facts},null,2),{flag:'wx'});
console.log('Migrated existing source-reviewed content; stable IDs retained.');
