const fs = require('fs');
const path = '/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/components/public/PortfolioGrid.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add animate-fade-in-up and animationDelay
const classRegex = /className=\{\`portfolio-card group cursor-pointer flex flex-col justify-between border border-\[var\(--color-outline-variant,#ccc5bd\)\] bg-\[var\(--color-surface,#fef9f2\)\] overflow-hidden transition-all duration-300 hover:shadow-lg \$\{/m;
const newClass = `className={\`portfolio-card animate-fade-in-up group cursor-pointer flex flex-col justify-between border border-[var(--color-outline-variant,#ccc5bd)] bg-[var(--color-surface,#fef9f2)] overflow-hidden transition-all duration-300 hover:shadow-lg \${`;
content = content.replace(classRegex, newClass);

const onClickRegex = /onClick=\{\(\) => setActiveItem\(item\)\}/m;
const newOnClick = `onClick={() => setActiveItem(item)}
                style={{ animationDelay: \`\${idx * 0.1}s\` }}`;
content = content.replace(onClickRegex, newOnClick);

fs.writeFileSync(path, content, 'utf8');
