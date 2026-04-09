import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Property Platform
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Browse published properties, save favorites, and manage listings by role.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/properties"
            className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Explore Properties
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
