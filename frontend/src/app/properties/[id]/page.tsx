import { notFound } from 'next/navigation';
import { ContactOwnerForm } from '../../../components/contact-owner-form';
import { FavoriteButton } from '../../../components/favorite-button';
import { API_URL } from '../../../lib/api-url';
import { PropertyRecord } from '../../../lib/types';

type PropertyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;

  let response: Response;

  try {
    response = await fetch(`${API_URL}/properties/${id}`, {
      cache: 'no-store',
    });
  } catch {
    return (
      <main className="page-shell max-w-4xl">
        <p className="text-red-600">Unable to load property details.</p>
      </main>
    );
  }

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    return (
      <main className="page-shell max-w-4xl">
        <p className="text-red-600">Unable to load property details.</p>
      </main>
    );
  }

  const property = (await response.json()) as PropertyRecord;

  return (
    <main className="page-shell max-w-4xl">
      <header className="panel flex items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">{property.title}</h1>
          <p className="mt-2 text-blue-700">{property.location}</p>
        </div>
        <FavoriteButton propertyId={property.id} />
      </header>

      <section className="panel mt-6 p-6">
        <p className="text-2xl font-semibold text-blue-950">${property.price.toLocaleString()}</p>
        <p className="mt-4 whitespace-pre-line text-blue-800">{property.description}</p>
      </section>

      <section className="panel mt-8 p-6">
        <h2 className="text-xl font-semibold text-blue-950">Images</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {property.images.map((image) => (
            <a
              key={image.id}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-blue-100 p-3 text-sm text-blue-800 underline"
            >
              {image.url}
            </a>
          ))}
        </div>
      </section>

      <ContactOwnerForm propertyId={property.id} />
    </main>
  );
}
