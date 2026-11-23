import {z} from 'zod';
import {writeFile} from 'node:fs/promises';
import {catalogueSchema} from '../src/domain/planning';
await writeFile(new URL('../public/catalogue.schema.json',import.meta.url),JSON.stringify(z.toJSONSchema(catalogueSchema),null,2)+'\n');
