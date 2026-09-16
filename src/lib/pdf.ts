export function printDocument() {
  if (typeof window === "undefined") return;
  window.print();
}
