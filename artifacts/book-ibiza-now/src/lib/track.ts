export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).gtag) {
    (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", event, props);
  }
}
