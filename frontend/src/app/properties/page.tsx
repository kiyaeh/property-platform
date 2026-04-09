import Link from 'next/link';
import { FavoriteButton } from '../../components/favorite-button';
import { PropertyListResponse } from '../../lib/types';

type PropertiesPageProps = {
  searchParams: Promise<{
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.location) query.set('location', params.location);
  if (params.minPrice) query.set('minPrice', params.minPrice);
  if (params.maxPrice) query.set('maxPrice', params.maxPrice);
  if (params.page) query.set('page', params.page);

  const response = await fetch(`${API_URL}/properties?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
        <p className="mt-4 text-red-600">Unable to load properties right now.</p>
      </main>
    );
  }

  const payload = (await response.json()) as PropertyListResponse;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Published Properties</h1>
        <span className="text-sm text-slate-600">Total: {payload.meta.total}</span>
      </div>

      <form className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <input
          name="location"
          defaultValue={params.location ?? ''}
          placeholder="Location"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          name="minPrice"
          defaultValue={params.minPrice ?? ''}
          placeholder="Min price"
          type="number"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          name="maxPrice"
          defaultValue={params.maxPrice ?? ''}
          placeholder="Max price"
          type="number"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button className="rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">
          Apply filters
        </button>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {payload.data.map((property) => (
          <article key={property.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{property.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{property.location}</p>
              </div>
              <FavoriteButton propertyId={property.id} />
            </div>
            <p className="mt-3 line-clamp-2 text-slate-700">{property.description}</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">${property.price.toLocaleString()}</p>
            <Link
              href={`/properties/${property.id}`}
              className="mt-4 inline-block font-semibold text-slate-900 underline"
            >
              View details
            </Link>
          </article>
        ))}
      </div>

      {payload.data.length === 0 ? (
        <p className="mt-8 text-slate-600">No properties match your filters.</p>
      ) : null}
    </main>
  );
}
