import fs from 'fs';
import path from 'path';

const hooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext'];

function checkHooks(file) {
  const content = fs.readFileSync(file, 'utf8');
  hooks.forEach(h => {
    const wordRegex = new RegExp(`\\b${h}\\b`);
    if (wordRegex.test(content)) {
      // Check if it's an import from react or defined or React.hook
      const isImported = new RegExp(`import\\s+[^;]*\\b${h}\\b[^;]*from\\s+['"]react['"]`).test(content);
      const isReactDot = content.includes(`React.${h}`);
      const isCustomDef = new RegExp(`const\\s+${h}\\s*=`).test(content) || new RegExp(`function\\s+${h}\\b`).test(content);
      const isPropOrKey = content.includes(`${h}:`) || content.includes(`.${h}(`);

      if (!isImported && !isReactDot && !isCustomDef && !isPropOrKey) {
        console.log(`WARNING: Potential missing ${h} in ${file}`);
      }
    }
  });
}

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist') walk(full);
    } else if (f.endsWith('.jsx') || f.endsWith('.js')) {
      checkHooks(full);
    }
  }
}

walk('frontend/src');
console.log('Hook check complete.');
