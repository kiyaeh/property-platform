const API_URL = process.env.API_URL ?? 'http://localhost:4000';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

async function main() {
  const ownerLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'owner@propertyplatform.com',
      password: 'Password123!',
    }),
  });

  const userLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'user@propertyplatform.com',
      password: 'Password123!',
    }),
  });

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@propertyplatform.com',
      password: 'Password123!',
    }),
  });

  const ownerToken = ownerLogin.accessToken;
  const userToken = userLogin.accessToken;
  const adminToken = adminLogin.accessToken;

  const created = await request('/owner/properties', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({
      title: 'Smoke Test Property',
      description: 'Property created by smoke test',
      location: 'Addis Ababa',
      price: 1900,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1460317442991-0ec209397118',
          mimeType: 'image/jpeg',
          size: 130000,
        },
        {
          url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858',
          mimeType: 'image/jpeg',
          size: 170000,
        },
      ],
    }),
  });

  const published = await request(`/owner/properties/${created.id}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });

  await request(`/users/favorites/${published.id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });

  await request(`/properties/${published.id}/contact`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: JSON.stringify({ message: 'Is this available next week?' }),
  });

  await request('/admin/properties/metrics', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  await request(`/admin/properties/${published.id}/disable`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  console.log('Smoke test passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
