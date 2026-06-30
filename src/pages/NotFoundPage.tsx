import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundInline({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <Compass size={48} style={{ color: "var(--text-muted)" }} />
      <h1 className="mt-4 text-2xl font-extrabold">Lost in the quest</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {message ?? "This page doesn’t exist."}
      </p>
      <Link
        to="/"
        className="mt-5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  return <NotFoundInline />;
}
