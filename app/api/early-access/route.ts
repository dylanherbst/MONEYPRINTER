import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';

// Early access sign-ups. Each email is saved as one private JSON file in the project's Vercel Blob store
// (early-access/<date>-<id>.json). Nothing is emailed or shared; the owner reads them in Vercel → Storage.

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: { email?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  // Honeypot: real people never fill the hidden "company" field.
  if (typeof body.company === 'string' && body.company.trim()) return Response.json({ ok: true });

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ ok: false, error: 'Sign-ups are not open yet. Please try again soon.' }, { status: 503 });
  }

  const createdAt = new Date().toISOString();
  try {
    await put(
      `early-access/${createdAt.slice(0, 10)}-${randomUUID()}.json`,
      JSON.stringify({ email, createdAt, source: 'website' }),
      { access: 'private', contentType: 'application/json', addRandomSuffix: false },
    );
  } catch {
    return Response.json({ ok: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
