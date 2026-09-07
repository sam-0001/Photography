const fs = require('fs');
const path = '/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/components/public/PortfolioGrid.tsx';
let content = fs.readFileSync(path, 'utf8');

const imgRegex = /<img\s+src=\{activeItem\.url\}\s+alt=\{activeItem\.title\}\s+className="w-full h-auto"\s+style=\{\{ display: 'block' \}\}\s+\/>/m;
const newImg = `<div className="relative w-full h-[80vh]">
                <Image
                  src={activeItem.url}
                  alt={activeItem.title}
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="100vw"
                  unoptimized={activeItem.url.startsWith('data:')}
                />
              </div>`;

if (content.match(imgRegex)) {
  content = content.replace(imgRegex, newImg);
  // Also need to import Image
  if (!content.includes("import Image from 'next/image';")) {
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\nimport Image from 'next/image';");
  }
}

fs.writeFileSync(path, content, 'utf8');
