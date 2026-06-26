import fs from 'node:fs';
import path from 'node:path';

function modelNameToSnake(modelName: string): string {
  return modelName
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

function parseModelTableMap(schema: string): Record<string, string> {
  const map: Record<string, string> = {};
  const blocks = schema.split(/^model /m).slice(1);

  for (const block of blocks) {
    const nameMatch = block.match(/^(\w+)/);
    if (!nameMatch) continue;
    const modelName = nameMatch[1];
    const mapMatch = block.match(/@@map\("([^"]+)"\)/);
    map[modelName] = mapMatch?.[1] ?? modelNameToSnake(modelName);
  }

  return map;
}

let cachedMap: Record<string, string> | null = null;

function resolveSchemaPath(): string {
  const candidates = [
    path.join(process.cwd(), 'prisma/schema.prisma'),
    path.join(process.cwd(), '../../packages/db/prisma/schema.prisma'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Prisma schema not found. Checked: ${candidates.join(', ')}`);
}

export function getModelTableName(model: string): string {
  if (!cachedMap) {
    const schema = fs.readFileSync(resolveSchemaPath(), 'utf8');
    cachedMap = parseModelTableMap(schema);
  }
  return cachedMap[model] ?? modelNameToSnake(model);
}

export function modelToDelegate(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}
