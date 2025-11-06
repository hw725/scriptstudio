export function createPageUrl(pageName: string) {
  // Use the given casing to match react-router routes (e.g., '/Workspace').
  return "/" + pageName.replace(/ /g, "-");
}
