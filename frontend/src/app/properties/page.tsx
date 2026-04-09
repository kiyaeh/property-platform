import Link from 'next/link';
import { FavoriteButton } from '../../components/favorite-button';
import { API_URL } from '../../lib/api-url';
import { PropertyListResponse } from '../../lib/types';

type PropertiesPageProps = {
  searchParams: Promise<{
    location?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
};

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.location) query.set('location', params.location);
  if (params.minPrice) query.set('minPrice', params.minPrice);
  if (params.maxPrice) query.set('maxPrice', params.maxPrice);
  if (params.page) query.set('page', params.page);

  let response: Response;

  try {
    response = await fetch(`${API_URL}/properties?${query.toString()}`, {
      cache: 'no-store',
    });
  } catch {
    return (
      <main className="page-shell max-w-5xl">
        <h1 className="text-3xl font-bold text-blue-950">Properties</h1>
        <p className="mt-4 text-red-600">Unable to load properties right now.</p>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className="page-shell max-w-5xl">
        <h1 className="text-3xl font-bold text-blue-950">Properties</h1>
        <p className="mt-4 text-red-600">Unable to load properties right now.</p>
      </main>
    );
  }

  const payload = (await response.json()) as PropertyListResponse;

  return (
    <main className="page-shell max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-blue-950">Published Properties</h1>
        <span className="text-sm text-blue-700">Total: {payload.meta.total}</span>
      </div>

      <form className="panel mt-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
        <input
          name="location"
          defaultValue={params.location ?? ''}
          placeholder="Location"
          className="field"
        />
        <input
          name="minPrice"
          defaultValue={params.minPrice ?? ''}
          placeholder="Min price"
          type="number"
          className="field"
        />
        <input
          name="maxPrice"
          defaultValue={params.maxPrice ?? ''}
          placeholder="Max price"
          type="number"
          className="field"
        />
        <button className="btn-primary px-4 py-2">
          Apply filters
        </button>
      </form>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {payload.data.map((property) => (
          <article key={property.id} className="panel p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-blue-950">{property.title}</h2>
                <p className="mt-1 text-sm text-blue-700">{property.location}</p>
              </div>
              <FavoriteButton propertyId={property.id} />
            </div>
            <p className="mt-3 line-clamp-2 text-blue-800">{property.description}</p>
            <p className="mt-3 text-lg font-semibold text-blue-950">${property.price.toLocaleString()}</p>
            <Link
              href={`/properties/${property.id}`}
              className="mt-4 inline-block font-semibold text-blue-950 underline"
            >
              View details
            </Link>
          </article>
        ))}
      </div>

      {payload.data.length === 0 ? (
        <p className="mt-8 text-blue-700">No properties match your filters.</p>
      ) : null}
    </main>
  );
}
