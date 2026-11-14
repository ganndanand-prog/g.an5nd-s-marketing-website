export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: string;
  badge?: string;
}

export interface SkillCategory {
  title: string;
  description?: string;
  skills: { name: string; level: number; note?: string }[];
}

export interface InstagramStat {
  label: string;
  value: string;
  change?: string;
  description: string;
  icon: string;
}

export interface InstagramReelWork {
  id: string;
  title: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  hook: string;
  theme: string;
  image: string;
  videoUrl?: string;
  tag: string;
}

export interface PricingPackage {
  id: string;
  title: string;
  badge?: string;
  priceNote: string;
  deliverables: string[];
  timeline: string;
  idealFor: string;
  popular?: boolean;
}

export interface PrincipleItem {
  id: string;
  title: string;
  desc: string;
  status: 'allowed' | 'forbidden';
}

export interface PortfolioProfile {
  name: string;
  title: string;
  subtitle: string;
  greeting?: string;
  bio: string[];
  email: string;
  location: string;
  instagramHandle: string;
  socials: {
    instagram: string;
  };
}
