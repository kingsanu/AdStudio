// Mock data for templates and images
export const mockTemplates = [
  {
    _id: "template1",
    title: "Social Media Post",
    description: "Perfect for Instagram and Facebook posts",
    templateUrl: "/templates/social-media-post.json",
    thumbnailUrl: "https://placehold.co/600x400/0070f3/ffffff?text=Social+Media+Post",
    tags: ["social", "instagram", "facebook"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    userId: "user1",
    pages: 1,
    isPublic: true,
  },
  {
    _id: "template2",
    title: "Marketing Banner",
    description: "Eye-catching banner for your marketing campaigns",
    templateUrl: "/templates/marketing-banner.json",
    thumbnailUrl: "https://placehold.co/600x200/7928ca/ffffff?text=Marketing+Banner",
    tags: ["marketing", "banner", "advertising"],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    userId: "user1",
    pages: 1,
    isPublic: true,
  },
  {
    _id: "template3",
    title: "Presentation Slide",
    description: "Professional presentation template",
    templateUrl: "/templates/presentation.json",
    thumbnailUrl: "https://placehold.co/600x400/ff0080/ffffff?text=Presentation",
    tags: ["presentation", "business", "slides"],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    userId: "user2",
    pages: 10,
    isPublic: true,
  },
  {
    _id: "template4",
    title: "Business Card",
    description: "Professional business card design",
    templateUrl: "/templates/business-card.json",
    thumbnailUrl: "https://placehold.co/600x400/0070f3/ffffff?text=Business+Card",
    tags: ["business", "card", "professional"],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    userId: "user1",
    pages: 1,
    isPublic: true,
  },
  {
    _id: "template5",
    title: "Event Flyer",
    description: "Promote your next event with this template",
    templateUrl: "/templates/event-flyer.json",
    thumbnailUrl: "https://placehold.co/600x400/f5a623/ffffff?text=Event+Flyer",
    tags: ["event", "flyer", "promotion"],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    userId: "user3",
    pages: 1,
    isPublic: true,
  },
  {
    _id: "template6",
    title: "Resume Template",
    description: "Stand out with this professional resume",
    templateUrl: "/templates/resume.json",
    thumbnailUrl: "https://placehold.co/600x400/50e3c2/ffffff?text=Resume",
    tags: ["resume", "cv", "job"],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    userId: "user1",
    pages: 2,
    isPublic: true,
  },
  {
    _id: "template7",
    title: "YouTube Thumbnail",
    description: "Get more views with this eye-catching thumbnail",
    templateUrl: "/templates/youtube-thumbnail.json",
    thumbnailUrl: "https://placehold.co/600x400/ff0000/ffffff?text=YouTube+Thumbnail",
    tags: ["youtube", "thumbnail", "video"],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    userId: "user2",
    pages: 1,
    isPublic: true,
  },
  {
    _id: "template8",
    title: "Logo Design",
    description: "Create a professional logo for your brand",
    templateUrl: "/templates/logo.json",
    thumbnailUrl: "https://placehold.co/600x400/000000/ffffff?text=Logo+Design",
    tags: ["logo", "brand", "identity"],
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days ago
    userId: "user1",
    pages: 1,
    isPublic: false,
  },
];

export const mockImages = [
  {
    _id: "image1",
    userId: "user1",
    url: "https://placehold.co/600x400/0070f3/ffffff?text=Image+1",
    filename: "image1.png",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    _id: "image2",
    userId: "user1",
    url: "https://placehold.co/600x400/7928ca/ffffff?text=Image+2",
    filename: "image2.png",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    _id: "image3",
    userId: "user1",
    url: "https://placehold.co/600x400/ff0080/ffffff?text=Image+3",
    filename: "image3.png",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    _id: "image4",
    userId: "user1",
    url: "https://placehold.co/600x400/50e3c2/ffffff?text=Image+4",
    filename: "image4.png",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
];
