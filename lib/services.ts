export type ServiceIcon = "file" | "pen" | "database" | "video" | "scan" | "camera";
export type ServiceGroup = "AI Training & Data" | "Content" | "Video";

export type Service = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  icon: ServiceIcon;
  group: ServiceGroup;
  tagline: string;
  overview: string[];
  capabilities: { title: string; items: string[] }[];
  useCases: string[];
  quality: string[];
  faqs: { q: string; a: string }[];
};

const commonSecurity =
  "Work is assigned only to named, vetted team members, and we follow the data-handling requirements you set out at scoping.";

export const services: Service[] = [
  /* ------------------------------ AI TRAINING & DATA ------------------------------ */
  {
    slug: "lidar-annotation",
    title: "LiDAR Annotation",
    group: "AI Training & Data",
    icon: "scan",
    tagline: "3D labels your perception models can trust.",
    shortDescription:
      "Precise 3D point-cloud labeling for autonomous driving, robotics and mapping, checked twice before it reaches you.",
    description:
      "We label LiDAR point clouds to your taxonomy and guidelines, with every sequence reviewed by a second specialist and passed through a final quality gate before delivery.",
    overview: [
      "Perception models are only as good as the labels they learn from. Inconsistent boxes, drifting object IDs and missed edge cases cost you far more in retraining than good annotation costs up front.",
      "Evaryn's LiDAR teams work to your guidelines, calibrate on a pilot batch first, and move every labeled sequence through independent peer review and QA, so what you receive is consistent, auditable and ready to train on.",
    ],
    deliverables: [
      "3D cuboids and oriented bounding boxes",
      "Point-cloud semantic and instance segmentation",
      "Multi-frame object tracking with consistent IDs",
      "Sensor-fusion labeling aligned to camera imagery",
    ],
    capabilities: [
      {
        title: "What we label",
        items: [
          "3D cuboids and oriented bounding boxes for vehicles, pedestrians, cyclists and custom classes",
          "Semantic and instance segmentation of point clouds",
          "Object tracking across frames with persistent IDs",
          "Lane, road-edge and drivable-area marking",
          "Sensor-fusion labeling aligned to camera frames",
        ],
      },
      {
        title: "How we work to your spec",
        items: [
          "Your taxonomy, attribute lists and edge-case rules, documented before work begins",
          "Pilot batch to calibrate quality and agree acceptance criteria",
          "Export in the schema your pipeline expects, including custom formats",
          "Batch-level quality reports and a shared edge-case log",
        ],
      },
    ],
    useCases: [
      "Autonomous vehicles and ADAS",
      "Warehouse and delivery robotics",
      "Mapping, surveying and infrastructure",
      "Smart-city and traffic analytics",
    ],
    quality: [
      "Guideline calibration on a pilot batch before you scale",
      "Independent peer review of every labeled sequence",
      "Final QA gate before anything is delivered",
      "Revision loop: your feedback goes straight back to the labeling team",
      commonSecurity,
    ],
    faqs: [
      { q: "Which formats and tools do you support?", a: "We work to your annotation guidelines and deliver in the schema your pipeline expects. Share your sensor setup and target export format at scoping and we will confirm the approach." },
      { q: "How do you keep labels consistent across a large dataset?", a: "Every project starts with written guidelines and a calibration batch. Each sequence is then reviewed by a second specialist and passed through QA, and recurring disagreements are logged and resolved in the guidelines." },
      { q: "Can we start with a small batch?", a: "Yes. We recommend it: send a representative sample and we will scope a pilot so you can judge quality before committing volume." },
    ],
  },
  {
    slug: "egocentric-video-collection",
    title: "Egocentric Video Collection",
    group: "AI Training & Data",
    icon: "camera",
    tagline: "Real-world, first-person footage: collected, consented and ready to train on.",
    shortDescription:
      "First-person video of real activities, captured by briefed contributors to your script, privacy-screened and delivered with full metadata.",
    description:
      "We design, run and quality-check egocentric video collection: recruiting and briefing contributors, capturing footage to your specification, protecting privacy and delivering clean, documented datasets.",
    overview: [
      "Robotics, embodied AI and smart-glasses models learn from how people actually see and do things. That data is hard to source: it needs the right people, consistent capture standards, informed consent and careful privacy handling.",
      "Evaryn runs the whole collection pipeline for you: scenario design, contributor recruitment and briefing, capture, screening and delivery, with every clip checked against your spec before it leaves us.",
    ],
    deliverables: [
      "First-person video captured to your script",
      "Consent records and privacy screening",
      "Per-clip metadata and delivery manifests",
      "Optional action, object and hand annotation",
    ],
    capabilities: [
      {
        title: "Collection, end to end",
        items: [
          "Scenario and script design: activities, environments, variety and diversity targets",
          "Contributor recruitment, briefing and onboarding",
          "Capture to your standards for device, resolution, frame rate, framing, lighting and duration",
          "Scheduling, progress tracking and replacement of rejected clips",
        ],
      },
      {
        title: "Privacy and quality",
        items: [
          "Informed consent collected and recorded for every contributor",
          "Restricted-location rules and, on request, blurring of faces, screens and personal information",
          "Screening for task adherence, stability, audio, completeness and usable framing",
          "Structured metadata and a manifest with every delivery",
        ],
      },
      {
        title: "Optional annotation",
        items: [
          "Action and activity segmentation",
          "Object and hand-interaction labeling",
          "Captions and structured descriptions of each clip",
        ],
      },
    ],
    useCases: [
      "Robotics and embodied AI",
      "AR/VR and smart glasses",
      "Activity recognition and video understanding",
      "Workplace, retail and hospitality process training",
    ],
    quality: [
      "Pilot collection so you approve capture quality before volume ramps up",
      "Every clip screened against your capture spec",
      "Independent review, then a final QA gate before delivery",
      "Consent and privacy handled as part of the process, not an afterthought",
      commonSecurity,
    ],
    faqs: [
      { q: "What equipment is used for capture?", a: "Capture is done on the devices you specify or approve. We confirm device, resolution, frame rate and mounting requirements at scoping." },
      { q: "How do you handle consent and privacy?", a: "Contributors give informed consent before capture, and we record it. We apply your restricted-location rules and can blur faces, screens and personal information on request." },
      { q: "Can you also label the footage?", a: "Yes. Our annotation teams can add action segments, object and hand-interaction labels and captions, reviewed through the same two-gate quality process." },
    ],
  },
  {
    slug: "data-annotation",
    title: "Data Annotation",
    group: "AI Training & Data",
    icon: "database",
    tagline: "Accurate, consistent labels across image, video and text.",
    shortDescription:
      "Quality-checked annotation for computer vision, language and preference-learning datasets.",
    description:
      "We support machine-learning teams with carefully reviewed annotation across visual and language datasets, from bounding boxes and segmentation to NLP tagging and RLHF preference labeling.",
    overview: [
      "Good annotation is mostly process: clear guidelines, trained annotators, independent review and fast feedback loops. That is exactly how we run every project.",
      "Whether you need thousands of images boxed, hours of video segmented or language data ranked for RLHF, each item is labeled by a trained specialist, reviewed by a second, and verified at a final QA gate.",
    ],
    deliverables: [
      "Bounding boxes, polygons and keypoints",
      "Image and video segmentation",
      "NLP tagging and classification",
      "RLHF preference ranking and response evaluation",
    ],
    capabilities: [
      {
        title: "Computer vision",
        items: [
          "Bounding boxes, polygons, keypoints and landmarks",
          "Semantic and instance segmentation",
          "Video object tracking and event labeling",
          "Image classification and attribute tagging",
        ],
      },
      {
        title: "Language and preference data",
        items: [
          "Named-entity, intent and sentiment tagging",
          "Text classification and content moderation labeling",
          "RLHF preference ranking and response evaluation",
          "Prompt and response quality review",
        ],
      },
    ],
    useCases: [
      "Computer-vision model training",
      "LLM fine-tuning and evaluation",
      "Content moderation and trust & safety",
      "Search, e-commerce and catalog quality",
    ],
    quality: [
      "Written guidelines and a calibration batch before scale-up",
      "Independent peer review of annotated work",
      "Final QA gate before delivery",
      "Performance ratings keep annotators accountable for quality",
      commonSecurity,
    ],
    faqs: [
      { q: "Do you annotate 3D and LiDAR data too?", a: "Yes. See our dedicated LiDAR Annotation service for point-cloud labeling, tracking and sensor-fusion work." },
      { q: "How do you maintain quality at volume?", a: "Every item passes peer review and a QA gate. Reviewer feedback goes back to the annotator, and ratings feed future task assignment." },
      { q: "Can you work in our annotation tool?", a: "Tell us about your tooling at scoping. We will confirm whether we work inside your platform or deliver in your required format." },
    ],
  },

  /* ------------------------------------ CONTENT ------------------------------------ */
  {
    slug: "non-technical-writing",
    title: "Content Writing",
    group: "Content",
    icon: "pen",
    tagline: "Content that earns attention and moves readers to act.",
    shortDescription:
      "Clear, original, audience-focused writing: articles, marketing copy, research and newsletters.",
    description:
      "We create thoughtful, original content that helps organizations communicate clearly, build authority and convert readers into customers.",
    overview: [
      "Strong content is specific, accurate and written for a real reader. We start from your audience and goal, match you with a writer who knows the subject, and put every piece through editorial review before you see it.",
      "Because we check for originality and inappropriate AI-generated text, you receive writing you can publish with confidence.",
    ],
    deliverables: [
      "Blog posts and articles",
      "Marketing and website copy",
      "Research papers and reports",
      "Newsletters and email sequences",
    ],
    capabilities: [
      {
        title: "What we write",
        items: [
          "Blog posts, thought-leadership articles and case studies",
          "Website, landing-page and product copy",
          "Newsletters and email campaigns",
          "Research summaries, reports and long-form guides",
        ],
      },
    ],
    useCases: [
      "Brand and content marketing",
      "SEO and growth content",
      "Executive and investor communications",
      "Education and research publishing",
    ],
    quality: [
      "Brief confirmed before writing starts",
      "Editorial review stage for accuracy, tone and completeness",
      "Final QA before delivery",
      "Originality checks, including checks for inappropriate AI-generated text",
      "Revisions handled directly with the writer",
    ],
    faqs: [
      { q: "Who owns the content?", a: "You do. Deliverables are prepared for your use once approved. We confirm any specific rights requirements at scoping." },
      { q: "Do you use AI to write?", a: "We emphasize original, human-written work and check for inappropriate AI-generated text as part of review." },
      { q: "Can you match our brand voice?", a: "Yes. Share style guides and examples and we will brief your writer accordingly." },
    ],
  },
  {
    slug: "technical-writing",
    title: "Technical Writing",
    group: "Content",
    icon: "file",
    tagline: "Documentation your users and engineers will actually read.",
    shortDescription:
      "Precise, well-structured documentation for complex products, systems and processes.",
    description:
      "We turn complex technical information into clear, structured documentation that helps developers, teams and end users understand and adopt your product.",
    overview: [
      "Documentation is part of the product. Unclear docs mean more support tickets, slower onboarding and lost deals.",
      "Our technical writers work from your source material and subject-matter experts, structure information for how people actually search and learn, and deliver documentation that stays accurate and maintainable.",
    ],
    deliverables: [
      "API and developer documentation",
      "Architecture and technical specifications",
      "User guides and technical manuals",
      "Whitepapers and technical case studies",
    ],
    capabilities: [
      {
        title: "What we document",
        items: [
          "API references, SDK guides and developer onboarding",
          "System architecture and design documents",
          "Product manuals, how-to guides and runbooks",
          "Whitepapers, technical blogs and release notes",
        ],
      },
    ],
    useCases: [
      "SaaS and developer-tool companies",
      "Hardware and IoT products",
      "Fintech and infrastructure platforms",
      "Internal engineering and operations teams",
    ],
    quality: [
      "Source material and terminology agreed up front",
      "Technical accuracy and completeness review",
      "Final QA before delivery",
      "Structured feedback and revision cycles",
    ],
    faqs: [
      { q: "What do you need from us to start?", a: "Access to source material such as specs, code samples or product demos, and a point of contact for questions." },
      { q: "Can you update existing documentation?", a: "Yes. We can audit, restructure and rewrite existing docs as well as write new ones." },
      { q: "What formats do you deliver in?", a: "Tell us your platform or format and we will confirm the deliverable at scoping." },
    ],
  },

  /* ------------------------------------- VIDEO ------------------------------------- */
  {
    slug: "video-editing",
    title: "Video Editing",
    group: "Video",
    icon: "video",
    tagline: "Polished post-production that makes your story land.",
    shortDescription:
      "Professional editing, color, sound and motion graphics, delivered consistently at volume.",
    description:
      "We create polished video with attention to pacing, visual consistency, sound quality and storytelling, from single campaign pieces to ongoing content pipelines.",
    overview: [
      "Great video is built in the edit. Pacing, color, sound and graphics are what separate content that holds attention from content that gets scrolled past.",
      "Our editors work to your brief and brand standards, and every cut passes an independent review and QA check before delivery, so quality stays consistent across your whole library.",
    ],
    deliverables: [
      "Cutting, pacing and storytelling edits",
      "Color correction and grading",
      "Motion graphics, titles and captions",
      "Sound mixing and clean-up",
    ],
    capabilities: [
      {
        title: "What we edit",
        items: [
          "Marketing, product and explainer videos",
          "Social and short-form content at volume",
          "Interviews, webinars and multi-camera timelines",
          "Training and corporate video",
        ],
      },
      {
        title: "Finishing",
        items: [
          "Color correction and grading for visual consistency",
          "Motion graphics, lower thirds, titles and subtitles",
          "Audio clean-up, mixing and music alignment",
          "Multiple aspect ratios and platform-ready exports",
        ],
      },
    ],
    useCases: [
      "Brand and performance marketing",
      "Creators, media and publishers",
      "Education and corporate training",
      "Product and app demos",
    ],
    quality: [
      "Brief and brand references confirmed before editing",
      "Independent review of every cut",
      "Final QA for sync, color, audio levels and exports",
      "Revision rounds handled directly with your editor",
    ],
    faqs: [
      { q: "How do we send footage?", a: "We agree a secure transfer method at scoping and confirm naming and folder conventions so your files stay organized." },
      { q: "Can you handle ongoing volume?", a: "Yes. We can assign a consistent editing team to an ongoing content pipeline so your style stays uniform." },
      { q: "How many revisions are included?", a: "We confirm the revision approach in your quote. Feedback goes directly back to your assigned editor." },
    ],
  },
];

export const serviceGroups: { group: ServiceGroup; title: string; blurb: string }[] = [
  { group: "AI Training & Data", title: "AI Training & Data", blurb: "The labeled and collected data that makes models perform, produced to your spec and quality-checked twice." },
  { group: "Content", title: "Content Writing", blurb: "Original writing for marketing, research and product documentation, edited and reviewed before delivery." },
  { group: "Video", title: "Video Editing", blurb: "Post-production that keeps your brand consistent across every cut." },
];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
