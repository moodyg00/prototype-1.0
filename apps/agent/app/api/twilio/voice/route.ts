export const runtime = 'nodejs';

export async function POST() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hello! This line accepts text messages only. Please hang up and send a text message to this number. Thank you!
  </Say>
</Response>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
