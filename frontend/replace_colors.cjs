const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Tailwind utility replacements
      content = content.replace(/bg-\[#0E1013\]/g, 'bg-asphalt-950');
      content = content.replace(/bg-\[#161A20\]/g, 'bg-asphalt-900');
      content = content.replace(/border-\[rgba\(255,255,255,0\.08\)\]/g, 'border-border-subtle');
      content = content.replace(/text-\[#FFC629\]/g, 'text-signal');
      content = content.replace(/bg-\[#FFC629\]/g, 'bg-signal');
      content = content.replace(/border-\[#FFC629\]/g, 'border-signal');
      content = content.replace(/ring-\[#FFC629\]/g, 'ring-signal');
      content = content.replace(/from-\[#FFC629\]/g, 'from-signal');
      content = content.replace(/to-\[#FFC629\]/g, 'to-signal');
      content = content.replace(/text-\[#FF7A1A\]/g, 'text-cone');
      content = content.replace(/bg-\[#FF7A1A\]/g, 'bg-cone');
      content = content.replace(/border-\[#FF7A1A\]/g, 'border-cone');
      content = content.replace(/ring-\[#FF7A1A\]/g, 'ring-cone');
      content = content.replace(/from-\[#FF7A1A\]/g, 'from-cone');
      content = content.replace(/to-\[#FF7A1A\]/g, 'to-cone');
      content = content.replace(/text-\[#F3F4F6\]/g, 'text-text-primary');
      content = content.replace(/text-\[#9CA3AF\]/g, 'text-text-muted');
      content = content.replace(/bg-\[#EF4444\]/g, 'bg-severity-high');
      content = content.replace(/text-\[#EF4444\]/g, 'text-severity-high');
      content = content.replace(/bg-\[#F59E0B\]/g, 'bg-severity-medium');
      content = content.replace(/text-\[#F59E0B\]/g, 'text-severity-medium');
      content = content.replace(/bg-\[#22C55E\]/g, 'bg-severity-low');
      content = content.replace(/text-\[#22C55E\]/g, 'text-severity-low');
      content = content.replace(/rounded-\[24px\]/g, 'rounded-card');
      
      // Inline style replacements
      content = content.replace(/#0E1013/g, 'var(--color-asphalt-950)');
      content = content.replace(/#161A20/g, 'var(--color-asphalt-900)');
      content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'var(--color-border-subtle)');
      content = content.replace(/#FFC629/g, 'var(--color-signal)');
      content = content.replace(/#FF7A1A/g, 'var(--color-cone)');
      content = content.replace(/#F3F4F6/g, 'var(--color-text-primary)');
      content = content.replace(/#9CA3AF/g, 'var(--color-text-muted)');
      content = content.replace(/#EF4444/g, 'var(--color-severity-high)');
      content = content.replace(/#F59E0B/g, 'var(--color-severity-medium)');
      content = content.replace(/#22C55E/g, 'var(--color-severity-low)');
      // Need to handle backgroundSize: '24px 24px' etc. replacing 24px with var(--radius-card) might be wrong for non-radius contexts, 
      // but wait, let's only replace 24px if it's clear it's a radius. 
      // Wait, let's not blindly replace '24px' strings because there's `backgroundSize: '24px 24px'`. We can skip arbitrary 24px replacement.

      // Any missing rgba(255,255,255,0.08) in tailwind arbitrary classes?
      content = content.replace(/-\[rgba\(255,255,255,0\.08\)\]/g, '-border-subtle');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
