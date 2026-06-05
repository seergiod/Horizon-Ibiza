import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <div className="mt-6">
          <Link to="/"
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-sunset)" }}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
