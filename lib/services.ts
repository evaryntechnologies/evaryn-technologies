export type Service = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  icon: "file" | "pen" | "database" | "video";
};

export const services: Service[] = [
  {
    slug: "technical-writing",
    title: "Technical Writing",
    shortDescription:
      "Precise, professional documentation for complex systems and products.",
    description:
      "We transform complex technical information into clear, structured documentation that helps teams, developers and end users understand products, processes and systems.",
    deliverables: [
      "API and developer documentation",
      "Architecture specifications",
      "Technical manuals",
      "Technical whitepapers",
    ],
    icon: "file",
  },
  {
    slug: "non-technical-writing",
    title: "Non-Technical Writing",
    shortDescription:
      "Clear, engaging and professionally structured written content.",
    description:
      "We create thoughtful, audience-focused content that helps organizations communicate ideas clearly, strengthen their messaging and present information professionally.",
    deliverables: [
      "Blog posts and articles",
      "Marketing copy",
      "Research papers",
      "Newsletters",
    ],
    icon: "pen",
  },
  {
    slug: "data-annotation",
    title: "Data Annotation",
    shortDescription:
      "Accurate, quality-focused annotation for advanced data workflows.",
    description:
      "We support machine learning and data operations with carefully reviewed annotation services across visual, spatial and language-based datasets.",
    deliverables: [
      "Bounding boxes and polygons",
      "Segmentation and LiDAR labeling",
      "RLHF labeling",
      "NLP tagging",
    ],
    icon: "database",
  },
  {
    slug: "video-editing",
    title: "Video Editing",
    shortDescription:
      "Professional post-production that brings ideas to life.",
    description:
      "We create polished video content with attention to visual consistency, sound quality, storytelling and professional presentation.",
    deliverables: [
      "Colour grading",
      "Motion graphics and titles",
      "Sound mixing",
      "Multi-camera timelines",
    ],
    icon: "video",
  },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
