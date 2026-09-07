const fs = require('fs');
const path = '/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update MediaDoc interface
const mediaDocRegex = /interface MediaDoc \{\s*_id: string;\s*title\?: string;\s*url\?: string;\s*thumbnailUrl\?: string;\s*category\?: string;\s*mediaType\?: string;\s*isPublished\?: boolean;\s*isFeatured\?: boolean;\s*\}/m;
const newMediaDoc = `interface MediaDoc {
  _id: string;
  title?: string;
  subtitle?: string;
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  mediaType?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  exif?: {
    camera?: string;
    lens?: string;
  };
}`;
content = content.replace(mediaDocRegex, newMediaDoc);

// Update fetch PATCH body
const fetchRegex = /body: JSON\.stringify\(\{\s*title: editingMedia\.title,\s*subtitle: editingMedia\.subtitle,\s*category: editingMedia\.category\s*\}\),/m;
const newFetch = `body: JSON.stringify({
        title: editingMedia.title,
        subtitle: editingMedia.subtitle,
        category: editingMedia.category,
        exif: editingMedia.exif
      }),`;
content = content.replace(fetchRegex, newFetch);

// Add fields to form
const formCategoryRegex = /<option key=\{c\}>\{c\}<\/option>\s*<\/React.Fragment>\s*\)\)\s*\}<\/select>\s*<\/div>/m;
const newFormFields = `<option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Camera (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. Leica M11" value={editingMedia.exif?.camera || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, camera: e.target.value } })} />
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Lens (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. 35mm f/1.4" value={editingMedia.exif?.lens || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, lens: e.target.value } })} />
                        </div>`;
// Wait, my regex matching needs to be precise. Let's do a string replace on the select closing div.
content = content.replace(
  "</select>\n                        </div>",
  `</select>
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Camera (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. Leica M11" value={editingMedia.exif?.camera || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, camera: e.target.value } })} />
                        </div>
                        <div>
                          <label style={{ ...S.label, color: S.primary, display: 'block', marginBottom: '0.375rem' }}>Lens (EXIF)</label>
                          <input style={inputCls} placeholder="e.g. 35mm f/1.4" value={editingMedia.exif?.lens || ''} onChange={e => setEditingMedia({ ...editingMedia, exif: { ...editingMedia.exif, lens: e.target.value } })} />
                        </div>`
);

fs.writeFileSync(path, content, 'utf8');
