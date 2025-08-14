import Link from "next/link";

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
        Dashboard
      </Link>
      <Link
        href="/goals"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Goals
      </Link>
      <Link
        href="/plans"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Plans
      </Link>
      <Link
        href="/data"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Data & Insights
      </Link>
    </nav>
  );
}