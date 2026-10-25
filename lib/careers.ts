export type Career = {
  slug: string;
  title: string;
  summary: string;
  requirements: string[];
  isOpen: boolean;
};

// Until administrator-managed recruitment is connected, all roles remain closed.
export const careers: Career[] = [
  { slug: "technical-writer", title: "Technical Writer", summary: "Produce precise documentation for technical audiences.", requirements: ["Clear technical communication", "Ability to research complex subjects", "Careful attention to documentation standards"], isOpen: false },
  { slug: "content-writer", title: "Content Writer", summary: "Create thoughtful, engaging non-technical content.", requirements: ["Strong written communication", "Editing and research skills", "Ability to adapt to different audiences"], isOpen: false },
  { slug: "data-annotator", title: "Data Annotator", summary: "Label and review structured datasets accurately.", requirements: ["Strong attention to detail", "Ability to follow annotation guidelines", "Consistent, quality-focused work"], isOpen: false },
  { slug: "video-editor", title: "Video Editor", summary: "Produce polished visual and audio content.", requirements: ["Experience with editing workflows", "Attention to pacing and sound", "Ability to follow creative briefs"], isOpen: false },
];

export const openCareers = careers.filter((career) => career.isOpen);
