import { 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  Cpu, 
  Utensils, 
  ShoppingBag, 
  Building2,
  Palette,
  Layers,
  Video,
  FileText,
  Aperture
} from "lucide-react";

export type PortfolioCategory = {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
};

export type Project = {
  id: string;
  title: string;
  image: string;
  category: string;
};

export type Industry = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  projects: Project[];
};

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { 
    id: "graphics", 
    name: "Graphic Designs", 
    icon: Palette, 
    description: "Brand identity, logos, and marketing materials.", 
    color: "bg-purple-100 text-purple-600" 
  },
  { 
    id: "carousels", 
    name: "Carousels", 
    icon: Layers, 
    description: "Engaging scrollable social media content.", 
    color: "bg-blue-100 text-blue-600" 
  },
  { 
    id: "videos", 
    name: "Reels", 
    icon: Video, 
    description: "Motion graphics and video editing.", 
    color: "bg-red-100 text-red-600" 
  },
  { 
    id: "copywriting", 
    name: "Copywriting", 
    icon: FileText, 
    description: "Compelling copy for brands and campaigns.", 
    color: "bg-green-100 text-green-600" 
  },
  { 
    id: "photo-editing", 
    name: "Photo Editing", 
    icon: Aperture, 
    description: "Professional retouching and color grading.", 
    color: "bg-orange-100 text-orange-600" 
  },
];

export const INDUSTRIES: Industry[] = [
  {
    id: "beauty",
    name: "Beauty & Wellness",
    icon: Sparkles,
    color: "bg-pink-100 text-pink-600",
    projects: [
        { id: "b1", title: "Skincare Campaign", image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop", category: "Social Media" },
        { id: "b2", title: "Spa Branding", image: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=600&auto=format&fit=crop", category: "Branding" },
        { id: "b3", title: "Product Shoot", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop", category: "Photography" },
        { id: "b4", title: "Wellness App", image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
        { id: "b5", title: "Organic Packaging", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&auto=format&fit=crop", category: "Packaging" },
        { id: "b6", title: "Beauty Blog", image: "https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Heart,
    color: "bg-blue-100 text-blue-600",
    projects: [
        { id: "h1", title: "Medical App", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
        { id: "h2", title: "Health Poster", image: "https://images.unsplash.com/photo-1584036561566-b93a945cd3e5?q=80&w=600&auto=format&fit=crop", category: "Print" },
        { id: "h3", title: "Clinic Website", image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        { id: "h4", title: "Doctor Profile", image: "https://images.unsplash.com/photo-1537368910025-bc005ca23c03?q=80&w=600&auto=format&fit=crop", category: "Branding" },
        { id: "h5", title: "Pharmacy Logo", image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=600&auto=format&fit=crop", category: "Logo" },
        { id: "h6", title: "Wellness Guide", image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=600&auto=format&fit=crop", category: "Editorial" },
    ]
  },
  {
    id: "tech",
    name: "Technology",
    icon: Cpu,
    color: "bg-indigo-100 text-indigo-600",
    projects: [
        { id: "t1", title: "SaaS Dashboard", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
        { id: "t2", title: "Tech Startup", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=600&auto=format&fit=crop", category: "Branding" },
        { id: "t3", title: "AI Interface", image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop", category: "UI Design" },
        { id: "t4", title: "Code Editor", image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=600&auto=format&fit=crop", category: "Software" },
        { id: "t5", title: "VR Experience", image: "https://images.unsplash.com/photo-1592478411213-61535fdd861d?q=80&w=600&auto=format&fit=crop", category: "VR/AR" },
        { id: "t6", title: "Mobile App", image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop", category: "Mobile" },
    ]
  },
  {
    id: "food",
    name: "Food & Beverage",
    icon: Utensils,
    color: "bg-orange-100 text-orange-600",
    projects: [
        { id: "f1", title: "Restaurant Menu", image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=600&auto=format&fit=crop", category: "Print" },
        { id: "f2", title: "Coffee Shop", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop", category: "Branding" },
        { id: "f3", title: "Food Packaging", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=600&auto=format&fit=crop", category: "Packaging" },
        { id: "f4", title: "Recipe Book", image: "https://images.unsplash.com/photo-1546549010-66011c422b74?q=80&w=600&auto=format&fit=crop", category: "Editorial" },
        { id: "f5", title: "Bakery Social", image: "https://images.unsplash.com/photo-1555507036-ab1f40388085?q=80&w=600&auto=format&fit=crop", category: "Social Media" },
        { id: "f6", title: "Juice Brand", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop", category: "Branding" },
    ]
  },
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    projects: [
        { id: "r1", title: "E-commerce Site", image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        { id: "r2", title: "Fashion Campaign", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop", category: "Photography" },
        { id: "r3", title: "Store Signage", image: "https://images.unsplash.com/photo-1555529733-0e670560f7e1?q=80&w=600&auto=format&fit=crop", category: "Print" },
        { id: "r4", title: "Product Catalog", image: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600&auto=format&fit=crop", category: "Editorial" },
        { id: "r5", title: "Sale Banner", image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        { id: "r6", title: "Shopping App", image: "https://images.unsplash.com/photo-1556742111-a301076d9d18?q=80&w=600&auto=format&fit=crop", category: "UI/UX" },
    ]
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: Building2,
    color: "bg-slate-100 text-slate-600",
    projects: [
        { id: "re1", title: "Property Listing", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
        { id: "re2", title: "Agency Branding", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=600&auto=format&fit=crop", category: "Branding" },
        { id: "re3", title: "Interior Shoot", image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop", category: "Photography" },
        { id: "re4", title: "Open House Flyer", image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=600&auto=format&fit=crop", category: "Print" },
        { id: "re5", title: "Virtual Tour", image: "https://images.unsplash.com/photo-1626178793926-22b28830aa30?q=80&w=600&auto=format&fit=crop", category: "VR" },
        { id: "re6", title: "Realtor Portfolio", image: "https://images.unsplash.com/photo-1573167243872-43c6433b9d40?q=80&w=600&auto=format&fit=crop", category: "Web Design" },
    ]
  },
];
