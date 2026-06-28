import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dirname, '..');
const assetsDir = path.join(pkgRoot, 'assets');
const srcDir = path.join(pkgRoot, 'src');

function pascal(name) {
  return name
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toJsxAttrs(attrs) {
  return attrs
    .replace(/\bfill-rule=/g, 'fillRule=')
    .replace(/\bfill="[^"]*"/g, '')
    .trim();
}

function parseAsset(file) {
  const raw = fs.readFileSync(path.join(assetsDir, file), 'utf8');
  const viewBox = (raw.match(/viewBox="([^"]+)"/) || [])[1];
  const paths = [...raw.matchAll(/<path([^>]*)\/>/g)].map((match) => match[1].trim());
  return { viewBox, paths };
}

for (const file of fs.readdirSync(assetsDir).filter((name) => name.endsWith('.svg'))) {
  const base = file.replace('.svg', '');
  const component = `${pascal(base)}Icon`;
  const { viewBox, paths } = parseAsset(file);
  const colorKey = base === 'flame' ? 'flameRed' : 'phosphorGreen';
  const pathLines = paths
    .map((attrs) => {
      const jsx = toJsxAttrs(attrs);
      return jsx ? `      <path ${jsx} />` : '      <path />';
    })
    .join('\n');

  const code = `import type { SvgIconProps } from './types';
import { ICON_COLORS } from './colors';

export function ${component}({
  size = 32,
  color = ICON_COLORS.${colorKey},
  className,
  title,
  ...props
}: SvgIconProps) {
  return (
    <svg
      viewBox="${viewBox}"
      width={size}
      height={size}
      fill={color}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
${pathLines}
    </svg>
  );
}
`;

  fs.writeFileSync(path.join(srcDir, `${component}.tsx`), code);
  console.log(`generated ${component}`);
}