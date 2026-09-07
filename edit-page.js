const fs = require('fs');
const path = '/Users/sohamchaudhari/Downloads/photo/brothers-photography/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace import
content = content.replace(
  "import StoriesCarousel from './components/public/StoriesCarousel';",
  "import PortfolioGrid from './components/public/PortfolioGrid';"
);

// Replace data fetching block
const fetchRegex = /let allStories[\s\S]*?\} catch \(err\) \{/m;
const newFetch = `let mediaItems: any[] = [];
  let films = DEFAULT_FILMS;

  try {
    await connectDB();

    // Query dynamic PortfolioMedia for the homepage grid
    const dbItems = await PortfolioMedia.find({ isPublished: true, mediaType: 'image' })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .limit(6)
      .lean();

    if (dbItems && dbItems.length > 0) {
      mediaItems = JSON.parse(JSON.stringify(dbItems));
    }

    // Query dynamic films from MongoDB
    const dbFilms = await PortfolioMedia.find({
      isPublished: true,
      $or: [{ category: /films/i }, { mediaType: 'video' }],
    })
      .sort({ isFeatured: -1, sortOrder: 1, createdAt: -1 })
      .limit(3)
      .lean();

    if (dbFilms && dbFilms.length > 0) {
      films = dbFilms.map((item: any) => ({
        title: item.title,
        subtitle: item.subtitle || 'Cinematic Film',
        category: item.category || 'Films',
        img: item.thumbnailUrl || item.url,
      }));
    }
  } catch (err) {`;
content = content.replace(fetchRegex, newFetch);

// Replace the Carousel section with PortfolioGrid
const sectionRegex = /<section className="w-full relative">\s*<StoriesCarousel allStories=\{allStories\} \/>\s*<\/section>/m;
const newSection = `<section className="px-5 md:px-16" style={{ maxWidth: 'var(--spacing-max-editorial, 1440px)', margin: '0 auto' }}>
        <PortfolioGrid initialMedia={mediaItems.length > 0 ? mediaItems : undefined} showFilter={false} />
      </section>`;
content = content.replace(sectionRegex, newSection);

fs.writeFileSync(path, content, 'utf8');
