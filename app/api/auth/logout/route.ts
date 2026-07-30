import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/serverAuth';
import { assertTrustedMutationRequest, securityErrorResponse } from '@/app/lib/serverSecurity';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        assertTrustedMutationRequest(request);
        const response = NextResponse.json({ success: true });
        clearSessionCookie(response);
        return response;
    } catch (error) {
        return securityErrorResponse(error) || NextResponse.json({ error: 'Не удалось завершить сеанс' }, { status: 500 });
    }
}
