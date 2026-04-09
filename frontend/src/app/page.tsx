import Link from "next/link";

export default function Home() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="panel-soft w-full max-w-3xl p-8 text-center sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Property Platform</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-blue-950 sm:text-5xl">
          Simple way to discover and manage properties
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-blue-700">
          Browse listings, save favorites, and manage properties with role-based dashboards.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/properties" className="btn-primary px-5 py-3 text-sm font-semibold">
            Explore Properties
          </Link>
          <Link href="/login" className="btn-secondary px-5 py-3 text-sm font-semibold">
            Login
          </Link>
          <Link href="/register" className="btn-secondary px-5 py-3 text-sm font-semibold">
            Register
          </Link>
        </div>
      </section>
    </main>
  );
}
