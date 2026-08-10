import {
  Workflow,
  Compass,
  ShoppingBag,
  Bot,
  Database,
  Globe,
  Rocket,
  Network,
  Megaphone,
  Palette,
  Code2,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  "ai-automation": Workflow,
  "ax-consulting": Compass,
  "shopping-mall": ShoppingBag,
  "chatbot": Bot,
  "erp-crm": Database,
  "website": Globe,
  "mvp": Rocket,
  "scraping": Network,
  "marketing": Megaphone,
  "design": Palette,
  "vibe-coding": Code2,
  "ai-automation-course": GraduationCap,
};

export default function ServiceIcon({ id, size = 20 }: { id: string; size?: number }) {
  const Icon = map[id] ?? Sparkles;
  return <Icon size={size} strokeWidth={1.75} aria-hidden />;
}
