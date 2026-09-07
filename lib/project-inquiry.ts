import { projects } from "@/lib/projects";

export function inquiryProject(id: unknown) {
  return typeof id === "string" ? projects.find(p => p.id === id) : undefined;
}
export function contactForProject(id: string) { return `/contact?project=${encodeURIComponent(id)}`; }
