// Writes client.schema.json from the Zod schema in src/lib/client-schema.ts,
// so agents and editors (VS Code: "$schema": "./client.schema.json") check
// client.json by the same rules as apply-client. Runs before every build.
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'astro/zod';
import { clientSchema } from '../src/lib/client-schema.ts';

const target = path.join(process.cwd(), 'client.schema.json');
const schema = {
  ...z.toJSONSchema(clientSchema, { io: 'input', unrepresentable: 'any' }),
  title: 'ISV Labs site-starter client file',
  description:
    'Everything for one local-business site. Only confirmed or publicly stated facts: unknown = null or leave the field out; never invent, never write [ЗАПОЛНИТЬ]. Apply with `npm run apply-client <file>`.',
};
const next = `${JSON.stringify(schema, null, 2)}\n`;
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== next) {
  fs.writeFileSync(target, next);
  console.log('client-schema: client.schema.json updated');
}
