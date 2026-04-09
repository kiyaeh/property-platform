import { notFound } from 'next/navigation';
import { FavoriteButton } from '../../../components/favorite-button';
import { PropertyRecord } from '../../../lib/types';

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000';

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/properties/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-red-600">Unable to load property details.</p>
      </main>
    );
  }

  const property = (await response.json()) as PropertyRecord;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{property.title}</h1>
          <p className="mt-2 text-slate-600">{property.location}</p>
        </div>
        <FavoriteButton propertyId={property.id} />
      </header>

      <p className="mt-4 text-2xl font-semibold text-slate-900">${property.price.toLocaleString()}</p>
      <p className="mt-6 whitespace-pre-line text-slate-700">{property.description}</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Images</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {property.images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-slate-200 p-3 text-sm text-slate-700 underline"
            >
              {image.url}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
