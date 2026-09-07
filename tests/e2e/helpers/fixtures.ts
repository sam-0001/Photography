/**
 * Authoritative test fixtures and generator utilities for Brother's Photography E2E tests.
 */

export function generateUniqueToken(prefix = 'event'): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${rand}`;
}

export function generateUniqueEmail(prefix = 'client'): string {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}.${timestamp}.${rand}@atelier-test.com`;
}

export const VALID_INQUIRIES = {
  standard: () => ({
    fullName: "Priya Sharma & Rahul Roy",
    email: generateUniqueEmail('priya.rahul'),
    phone: "+39 02 8904 1234",
    commissionNature: "Multi-day Wedding Monograph",
    estimatedDate: "2026-10-14T00:00:00.000Z",
    venue: "Villa Balbiano, Lake Como, Italy",
    visionNotes: "Archival medium-format documentation and natural daylight portraits."
  }),
  minimal: () => ({
    fullName: "Elena Rostova",
    email: generateUniqueEmail('elena'),
    commissionNature: "Bespoke Editorial Portraiture",
    estimatedDate: "2026-11-20T00:00:00.000Z",
    venue: "Studio Saint-Germain, Paris"
  }),
  destination: () => ({
    fullName: "Vikram & Ananya",
    email: generateUniqueEmail('vikram.ananya'),
    phone: "+91 98200 12345",
    commissionNature: "Intimate Destination Pre-Wedding",
    estimatedDate: "2027-02-18T00:00:00.000Z",
    venue: "Taj Lake Palace, Udaipur, India",
    visionNotes: "Cinematic 16mm analog rolls and heirloom leather album."
  })
};

export const INVALID_INQUIRIES = {
  malformedEmail: () => ({
    fullName: "Marcus Aurelius",
    email: "not-an-email-at-all",
    commissionNature: "Commercial Fine-Art Campaign",
    estimatedDate: "2026-12-01T00:00:00.000Z",
    venue: "Rome Atelier"
  }),
  missingFullName: () => ({
    email: generateUniqueEmail('noname'),
    commissionNature: "Multi-day Wedding Monograph",
    estimatedDate: "2026-10-10T00:00:00.000Z",
    venue: "Venice, Italy"
  }),
  missingVenue: () => ({
    fullName: "Sophie Martin",
    email: generateUniqueEmail('sophie'),
    commissionNature: "Bespoke Editorial Portraiture",
    estimatedDate: "2026-09-30T00:00:00.000Z"
  }),
  emptyPayload: () => ({})
};

export const CLIENT_EVENTS = {
  createPayload: (overrides: Record<string, unknown> = {}) => {
    const token = (overrides.urlToken as string) || generateUniqueToken('vault');
    return {
      eventName: "Rahul & Priya — The Two-Continent Nuptials",
      clientName: "Rahul & Priya",
      clientEmail: generateUniqueEmail('rahul.priya'),
      clientPhone: "+39 02 8904 1234",
      eventDate: "2025-10-14T00:00:00.000Z",
      venue: "Villa Balbiano, Lake Como, Italy",
      description: "Fine-art Lake Como monograph and garden cocktail archive.",
      urlToken: token,
      pin: "2025",
      visibilityStatus: "published",
      downloadsEnabled: true,
      sharingEnabled: true,
      ...overrides
    };
  }
};

export const SAMPLE_PRIVATE_MEDIA = [
  {
    title: "Vessel Crossing at Sunset",
    category: "Ceremony",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=90",
    thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=75",
    aspectRatio: "4:5",
    exif: {
      camera: "Leica M11-P",
      lens: "50mm Summilux-M f/1.4",
      aperture: "f/1.4",
      shutter: "1/1250s",
      iso: "ISO 64"
    },
    isCover: true,
    sortOrder: 1
  },
  {
    title: "Vows in the Balbiano Garden",
    category: "Ceremony",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=2400&q=90",
    thumbnailUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=75",
    aspectRatio: "4:5",
    exif: {
      camera: "Hasselblad H6D-100c",
      lens: "HC 2,2/100mm",
      aperture: "f/2.2",
      shutter: "1/800s",
      iso: "ISO 100"
    },
    isCover: false,
    sortOrder: 2
  },
  {
    title: "Priya Editorial Solo in Silk",
    category: "Portraits",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=90",
    thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=75",
    aspectRatio: "4:5",
    exif: {
      camera: "Leica SL3",
      lens: "Summicron-SL 75mm f/2 ASPH",
      aperture: "f/2.0",
      shutter: "1/500s",
      iso: "ISO 50"
    },
    isCover: false,
    sortOrder: 3
  },
  {
    title: "Twilight Waltz under Chandeliers",
    category: "Reception",
    mediaType: "image",
    url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2400&q=90",
    thumbnailUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=75",
    aspectRatio: "16:9",
    exif: {
      camera: "Leica M11-P",
      lens: "35mm Summicron-M f/2",
      aperture: "f/2.0",
      shutter: "1/250s",
      iso: "ISO 800"
    },
    isCover: false,
    sortOrder: 4
  }
];
