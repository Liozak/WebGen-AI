import { PromptTemplate } from './types';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    label: 'Portfolio',
    prompt: 'Create a modern, minimalist portfolio for a graphic designer named "Alex Cole". Include a bio, a masonry grid gallery of work, a skills section, and a contact form. Use a dark theme with neon accents.',
    icon: 'briefcase'
  },
  {
    label: 'SaaS Landing',
    prompt: 'Build a high-converting landing page for a SaaS AI analytics tool called "DataMind". Include a hero section with a CTA, a features grid with icons, a pricing table with 3 tiers, and a testimonial slider.',
    icon: 'rocket'
  },
  {
    label: 'Restaurant',
    prompt: 'Design an elegant website for an Italian restaurant called "La Dolce Vita". Include a menu section, an "About Chef" section with a photo, and a reservation form. Use warm, appetizing colors.',
    icon: 'utensils'
  },
  {
    label: 'Agency',
    prompt: 'Create a corporate website for a digital marketing agency. Sections: Home, Services (SEO, PPC, Social), Our Team, Case Studies, and Contact. Use a professional blue and white color scheme.',
    icon: 'building'
  }
];