import { connectDB } from './mongodb';
import {
  Admin,
  ClientEvent,
  PortfolioMedia,
  PrivateEventMedia,
  Enquiry,
} from './models';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';

export interface SeedResult {
  success: boolean;
  seeded: boolean;
  message: string;
  details?: {
    admin: string;
    flagshipEvent: string;
    privatePhotosCount: number;
    portfolioStoriesCount: number;
    enquiriesCount: number;
  };
  error?: string;
}

/**
 * Seeds the database with default administrative credentials, flagship client event,
 * curated private photos with EXIF metadata, portfolio stories, and sample enquiries.
 *
 * Idempotent: Does not re-seed if flagship data exists unless `force: true` is passed.
 */
export async function seedDatabase(options: { force?: boolean } = {}): Promise<SeedResult> {
  try {
    await connectDB();

    const existingAdmin = await Admin.findOne({ username: 'admin' });
    const existingFlagship = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' });

    if (!options.force && existingAdmin && existingFlagship) {
      const privatePhotosCount = await PrivateEventMedia.countDocuments({ urlToken: 'rahul-priya-2025' });
      const portfolioStoriesCount = await PortfolioMedia.countDocuments();
      const enquiriesCount = await Enquiry.countDocuments();

      return {
        success: true,
        seeded: false,
        message: 'Database already contains seeded atelier data. Use force=true to overwrite.',
        details: {
          admin: existingAdmin.username,
          flagshipEvent: existingFlagship.urlToken,
          privatePhotosCount,
          portfolioStoriesCount,
          enquiriesCount,
        },
      };
    }

    if (options.force) {
      console.log('[Seed] Force flag detected: resetting flagship data...');
      await Admin.deleteMany({ username: 'admin' });
      await ClientEvent.deleteMany({ urlToken: 'rahul-priya-2025' });
      await PrivateEventMedia.deleteMany({ urlToken: 'rahul-priya-2025' });
      await PortfolioMedia.deleteMany({});
      await Enquiry.deleteMany({});
    }

    // 1. Seed Studio Admin (admin / atelier2025)
    const adminPasswordHash = await bcrypt.hash('atelier2025', 10);
    const admin = await Admin.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        email: 'admin@brothersatelier.com',
        passwordHash: adminPasswordHash,
        name: 'Julian Brother — Studio Principal',
        role: 'superadmin',
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 2. Seed Flagship Client Event (Rahul & Priya Nuptials)
    const pinHash = await bcrypt.hash('2025', 10);
    const galleryUrl = 'https://brothersatelier.com/gallery/rahul-priya-2025';
    const qrCodeDataUrl = await QRCode.toDataURL(galleryUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1A1918',
        light: '#FAF8F5',
      },
    });

    const flagshipEvent = await ClientEvent.findOneAndUpdate(
      { urlToken: 'rahul-priya-2025' },
      {
        eventName: 'Rahul & Priya — The Two-Continent Nuptials',
        clientName: 'Rahul & Priya',
        clientEmail: 'priya.rahul@como-nuptials.com',
        clientPhone: '+39 02 8904 1234',
        eventDate: new Date('2024-10-14T00:00:00.000Z'),
        venue: 'Villa Balbiano, Lake Como, Italy',
        description:
          'Grand luxury wedding of an Indian bride and groom at Lake Como with historical Italian neoclassical architecture in the background.',
        urlToken: 'rahul-priya-2025',
        pinHash,
        visibilityStatus: 'published',
        downloadsEnabled: true,
        sharingEnabled: true,
        qrCodeDataUrl,
        viewCount: 348,
        downloadCount: 1420,
        archivalExpiryDate: new Date('2026-10-14T00:00:00.000Z'),
      },
      { upsert: true, returnDocument: 'after' }
    );

    if (!flagshipEvent) {
      throw new Error('Failed to create or retrieve flagship client event.');
    }

    // 3. Seed 6 Curated Private Gallery Photos with Full EXIF Data
    await PrivateEventMedia.deleteMany({ urlToken: 'rahul-priya-2025' });

    const privatePhotos = [
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0042.RAW',
        caption:
          'Intimate editorial portrait of bride Priya holding an organic bouquet of white florals and eucalyptus leaves while overlooking Lake Como balcony at sunset.',
        category: 'Portraits',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFltlseB4bnHksWri-keONXiA5bHWnhOWGfGYwqmdzD2ea9QvsXaY-8TEpF3SXV9g3EhRqDDDtADnrpybdg6CT93tHtrkoyBxb6VbhJ8JEzXzprnVCqpMNXFPAYnXcAUuVHNXinp6Hsw0qRjPY4efwkPibd1a6WnSLReolWQaZGMwdgMleyl6MzBK_mBw5hSkMykKaXfVOYcOJStmRqxUWrXuI73nRasGfjJr5-MamvXdBS8zZVSz3',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Leica M11',
          lens: '50mm f/1.2',
          shutter: '1/800s',
          aperture: 'f/1.2',
          iso: '100',
          focalLength: '50mm',
        },
        sortOrder: 1,
        isCover: true,
      },
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0089.RAW',
        caption:
          'Groom Rahul adjusting his bespoke Italian ivory dinner jacket cuffs while standing in front of antique carved wooden doorway at Lake Como Villa.',
        category: 'Portraits',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDH7FE_WRRnzltBlv---y_o7sI4S3ryD2ipspGt9mWDBk72Ws5C4rrv2F8-w6sROGGbDk_iDm_HE0sjxKI_XkvGRMKlBN09sXvEpAWYsheqS_Cu6jcyLGfKUTFGCw8P6-d0WhihUoQRYEPUCcDHIUd2xfOxrhuAr8NIyMVqov6eVcqxP12Sdj288F02CJG6Jn3gqeKX-ZXffA7LrhX1QivN6b19ES1zesohJ_yasUXWByqVHWwKHvkY',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Leica M11',
          lens: '85mm f/1.4',
          shutter: '1/1200s',
          aperture: 'f/1.4',
          iso: '64',
          focalLength: '85mm',
        },
        sortOrder: 2,
        isCover: false,
      },
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0145.RAW',
        caption:
          'Vow exchange ceremony on the lakeside garden lawn with hundreds of soft ivory candles and white floral arrangements framing the couple.',
        category: 'Ceremony',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuhL4K66oUGcsHXsyHluRvc9aOAWxKPcTqVkYo8nNmwvkq6uPUmUgNvmHeKqNYi5d2dFzg_2yeowNEiRT0evKvGMBuWaXE0zFDaOmp1sotIN6YeRH3qZIOegiVR13-YAwdnQ-ZO6wD79y4FG7xbKc56Eee8NMrYu1VywsTtrf4kPA62keDrop2yR6XiTXtTJyxjcCEvgV4KAI1GHXhq_ooUijwL4qhbfnVFVIBl8fUOdQiZeoRWhUg',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Hasselblad X2D',
          lens: '38mm f/2.5',
          shutter: '1/640s',
          aperture: 'f/2.5',
          iso: '200',
          focalLength: '38mm',
        },
        sortOrder: 3,
        isCover: false,
      },
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0188.RAW',
        caption:
          'Artistic monochrome photograph of the couple laughing candidly as rice petals flutter down during their procession exit down the grand stone staircase.',
        category: '35mm',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFvQn7qZQph87rt3vODMNyn07-xvqZ327xlS5PYXPgMaslRqxCBdfhuL_fO1OpP9Vxf_GSElyIMM-YdHdp9dB_6B7xGyM6IU7x_NardwESDh8FR860uu2AOu-QmO2zwgt9gFDjKB_zq_DPjUkn0Q72p7iPCxficn_tuL5lYV7b16OAZPYmqTCZ8J880Gc0BsLhQhf3nR38BZxi0S7MluIyWz0Y94wqmocn40evixKmURoZ4z4Wzsb5',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Leica M6',
          lens: '28mm f/2.8',
          shutter: '1/2000s',
          aperture: 'f/2.8',
          iso: '400',
          focalLength: '28mm',
        },
        sortOrder: 4,
        isCover: false,
      },
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0219.RAW',
        caption:
          'Intimate first dance under fairy lit marquee canopy at night with champagne glass chandeliers reflected in floor to ceiling vintage French glass windows.',
        category: 'Reception',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPc7sIPPoZR1O0qSQSEqszljWe5wwt6brU6ImdAWHhoD4M0y0u83H_r5vhP6pWnRkPO55_6y8ZkWFQh1lpaQeSL0zJmFJeVV91pa4rFUt98-FGVpVuUvI9fRP1zj8WSVi9WfjZk1TPPDILCUpk8KUMWeZeDF3vvUf1-YQUnCsOLNjvcLwzGj5efT8sQTqgiCGAXReILch1-f9IRDPhFW8L555wrP93d5lEcXEHnqAih5yYCx0KTV6v',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Leica M11',
          lens: '50mm f/1.2',
          shutter: '1/250s',
          aperture: 'f/1.2',
          iso: '1600',
          focalLength: '50mm',
        },
        sortOrder: 5,
        isCover: false,
      },
      {
        eventId: flagshipEvent._id,
        urlToken: 'rahul-priya-2025',
        title: 'IMG_0248.RAW',
        caption:
          "Editorial details flat lay featuring personalized hand-calligraphed wedding vows on deckled edge cotton paper, vintage wax seal stamp, and couple's antique diamond rings resting on beige linen fabric.",
        category: 'Ceremony',
        mediaType: 'image' as const,
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqx3QYYs3VMvOgOybXDlEcv1EN67EjpUopI8_9q0fuqFqLm2ywSDCODyA2MecNQhQJP63RjslIaHiwJNDExM6ck5TnfClL3HZRhLOdm0XHy_ObQRv3YrwAqF6WTWRMD2ruSvQDisecQgtCnkttKfFmKIm2JLK6ay5cL_pfvWf0dmal_ofAjvY8EgoDu915nNzYXnWtsCAoo6UAB_s2ldEa3fuaosc9dJOup1PHxox_VjQM-p9-Mhkb',
        aspectRatio: '4:5' as const,
        exif: {
          camera: 'Sony A7R V',
          lens: '90mm Macro f/2.8',
          shutter: '1/400s',
          aperture: 'f/2.8',
          iso: '100',
          focalLength: '90mm',
        },
        sortOrder: 6,
        isCover: false,
      },
    ];

    const createdMedia = await PrivateEventMedia.insertMany(privatePhotos);
    flagshipEvent.mediaIds = createdMedia.map((m) => m._id);
    await flagshipEvent.save();

    // 4. Seed Public Portfolio Stories
    const existingPortfolioCount = await PortfolioMedia.countDocuments();
    if (existingPortfolioCount === 0 || options.force) {
      const portfolioStories = [
        {
          title: 'The Two-Continent Nuptials',
          subtitle: 'Lake Como & Mumbai · 84 Plates',
          category: 'Weddings',
          mediaType: 'image' as const,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi7BcmrwhvmT2ZVCDWgLmU9sqpIbAxaohr8PNM-PxiKjgFFYrOhxkPw3QKbpaKgTHR2lcDpnaaPq3KbJ5LO3IMKNpgYgJZ8PLTjF5CkEjftL-l605NRpUo7608OdbkAKolaUaHXVi_VFAVn9yp0ECV08BkwST6NRiphCmh3IadlW78c44gnQqjU_5lfFKQ-5Cl2PX3OIXjFEj8cPmfqpINjvjTzrrlR0UmHTnWf1fg0dXaJKkOClW1',
          aspectRatio: '4:3' as const,
          isPublished: true,
          isFeatured: true,
          sortOrder: 1,
          exif: { camera: 'Leica M11', lens: '35mm f/1.4', focalLength: '35mm' },
        },
        {
          title: 'Venetian Twilight & Gondola',
          subtitle: 'Venice Canal Grande · 42 Plates',
          category: 'Pre-Wedding',
          mediaType: 'image' as const,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL__Yaw4BAUsjX0G-sXhlAdKnqMaEAL9gChpDU_BDThdaCXT7n04lmmWOH2RPgl1XFEAnkKx9ezXximemtRHJlNuG4cM7fa2-ELbo6cUgTidoQE1jHEO7RtzvEZizKn9_E0ETR5biNmReFA0tYt1EVPEtB_Ql-Mzol4RQjiv9fpAM1eTjpqXgcttuM8UeMcTtIUg69yZC29Rlv20nYtrDBSDqOagZwtPt6hQkNGC0Mz-fGPz95mlz9',
          aspectRatio: '4:3' as const,
          isPublished: true,
          isFeatured: false,
          sortOrder: 2,
          exif: { camera: 'Hasselblad 500C/M', lens: '80mm f/2.8', focalLength: '80mm' },
        },
        {
          title: 'Éléonore & Julian — Parisian Dawn',
          subtitle: 'Place Vendôme & Jardin des Tuileries, Paris · 64 Plates',
          category: 'Pre-Wedding',
          mediaType: 'image' as const,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyBID4WOE_fOgKHp0xsZNx3qMVZfzJCZDoNng2N6bu9Gbx17wLNtjY2-EM-2jbSYoswAuNaEuVKmspfPPKJc-JQFHRzSwy4BAZwx8zK80XPCjdARrExx24ZAThpfGpJpzzexgIIz2XQbUnKcSjBXJ-Y5pSY07EWHIdSQEy1iJLtRaxxuSVwTER-gCcTsYGZTarIB9QaLQBbpM5VIbxF2y4OaXXlirm4xHCdnvzudZqUc5aYBUlfxYH',
          aspectRatio: '3:4' as const,
          isPublished: true,
          isFeatured: false,
          sortOrder: 3,
          exif: { camera: 'Leica M6', lens: '50mm f/1.4', focalLength: '50mm' },
        },
        {
          title: 'Udaipur Palace Royalty — The Royal Courtyard Session',
          subtitle: 'Lake Pichola Palace · 96 Plates',
          category: 'Portraits',
          mediaType: 'image' as const,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbYo1UI4kIQigpY5Fhu1_9jjbLiZjyLK1OvN3HQhF5SyeCIuSCkVA8pZ8n48CudjFusFbaxSm3A4AZ93qaBsnZXNUnv-9HHT0JV33-NmTvBmyid8lim-FSZR2wHJMBp6SuH6qHK33YtdrLBzN4JyVHBsQeHV2DsxHKPSSvl-q9bnukQFoigkAvcKHxMB6mULDn4cY3hOJqMUPZZ-Z9RN0XuHGLNh4zTl4e16-X8_MvCIyatB0ewCNc',
          aspectRatio: '4:3' as const,
          isPublished: true,
          isFeatured: false,
          sortOrder: 4,
          exif: { camera: 'Sony A7R V', lens: '50mm f/1.2', focalLength: '50mm' },
        },
        {
          title: 'The Vows at Villa Balbiano Master Film',
          subtitle: 'Rahul & Priya · 35mm & Anamorphic Cinema',
          category: 'Films',
          mediaType: 'video' as const,
          url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt-0mKQpD7y1wa18mrIUU4ZVax4fWZZOCIMfi7TmrK9eAQKrAAF5Jo6ABFRzD1jTmZu-0Gd6J8VVt6EK3Zd1PsxRvxy1DDkHhWcLVyFAIbNZFtHUT5HI77vpauLhLMoCK4e4L2z-ML460ucRsKy4Lrc8BqQAg5DAdhf7i_6N6FdGE_cVL-yUSF-2XuPilJpwYdtcf1-0wGHhiIZFeuXcuGCiWqkraEdzXIPe869bdp6yWB_wRCgwq-',
          aspectRatio: '16:9' as const,
          isPublished: true,
          isFeatured: true,
          sortOrder: 5,
          exif: { camera: 'Arri Alexa Mini LF', lens: 'Cooke Anamorphic 40mm' },
        },
      ];

      await PortfolioMedia.insertMany(portfolioStories);
    }

    // 5. Seed Initial Archival Inquiries
    const existingEnquiriesCount = await Enquiry.countDocuments();
    if (existingEnquiriesCount === 0 || options.force) {
      const initialEnquiries = [
        {
          fullName: 'Dev & Mira Kapoor',
          email: 'dev.kapoor@udaipur-weddings.in',
          phone: '+91 98200 12345',
          commissionNature: 'Multi-day Wedding Monograph',
          estimatedDate: new Date('2025-12-18T00:00:00.000Z'),
          venue: 'City Palace, Udaipur, India',
          visionNotes:
            'Requesting bespoke 8x10 large format negative coverage for four days of royal celebrations.',
          status: 'new' as const,
        },
        {
          fullName: 'Claire & Antoine',
          email: 'claire.antoine@paris-salons.fr',
          phone: '+33 1 42 68 55 00',
          commissionNature: 'Intimate Destination Pre-Wedding',
          estimatedDate: new Date('2026-05-22T00:00:00.000Z'),
          venue: 'Private Estate, Paris, France',
          visionNotes:
            'High-fashion architectural portraiture along Seine bridges and Musée Rodin sculpture gardens.',
          status: 'booked' as const,
        },
        {
          fullName: 'Kenji & Hana',
          email: 'kenji.hana@kyoto-temples.jp',
          phone: '+81 75 761 0011',
          commissionNature: 'Bespoke Editorial Portraiture',
          estimatedDate: new Date('2025-09-05T00:00:00.000Z'),
          venue: 'Arashiyama Temple, Kyoto, Japan',
          visionNotes:
            'Custom silk-bound handmade album with hand-pulled platinum palladium photographic prints.',
          status: 'contacted' as const,
        },
        {
          fullName: 'Sofia & Matteo',
          email: 'sofia.matteo@tuscany-villas.it',
          phone: '+39 055 220033',
          commissionNature: 'Multi-day Wedding Monograph',
          estimatedDate: new Date('2024-08-14T00:00:00.000Z'),
          venue: 'Villa Cora, Florence, Italy',
          visionNotes:
            'Delivery of boxed linen portfolio completed and signed by Julian Brother.',
          status: 'closed' as const,
        },
        {
          fullName: 'Lady Eleanor Vance',
          email: 'eleanor.vance@cotswolds-manor.co.uk',
          phone: '+44 1451 830100',
          commissionNature: 'Commercial Fine-Art Campaign',
          estimatedDate: new Date('2024-06-10T00:00:00.000Z'),
          venue: 'Manor House, Cotswolds, UK',
          visionNotes:
            'Client schedule rescheduled to following calendar year due to private foundation travel.',
          status: 'closed' as const,
        },
      ];

      await Enquiry.insertMany(initialEnquiries);
    }

    const finalPortfolioCount = await PortfolioMedia.countDocuments();
    const finalEnquiriesCount = await Enquiry.countDocuments();

    console.log('[Seed] Atelier database successfully seeded.');
    return {
      success: true,
      seeded: true,
      message: 'Atelier database successfully seeded with demo records.',
      details: {
        admin: admin.username,
        flagshipEvent: flagshipEvent.urlToken,
        privatePhotosCount: createdMedia.length,
        portfolioStoriesCount: finalPortfolioCount,
        enquiriesCount: finalEnquiriesCount,
      },
    };
  } catch (error: unknown) {
    console.error('[Seed] Database seeding failed:', error);
    const err = error as { message?: string };
    return {
      success: false,
      seeded: false,
      message: 'Failed to seed database.',
      error: err?.message || String(error),
    };
  }
}

// Standalone CLI runner support (e.g. `npx tsx lib/seed.ts` or `npm run seed`)
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.endsWith('seed')) {
  const force = process.argv.includes('--force');
  seedDatabase({ force })
    .then((result) => {
      console.log('[Seed CLI Result]:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('[Seed CLI Fatal]:', err);
      process.exit(1);
    });
}
