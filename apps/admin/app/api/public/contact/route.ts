import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { createPublicContactIntake } from '@/src/lib/public-contact-intake';
import { applyPublicSiteCors, publicSitePreflightResponse } from '@/src/lib/public-site-cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
  return publicSitePreflightResponse(request);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await createPublicContactIntake(formData);
    const response = NextResponse.json(result, { status: 201 });
    return applyPublicSiteCors(request, response);
  } catch (error) {
    const response = handleRouteError(error);
    return applyPublicSiteCors(request, response);
  }
}