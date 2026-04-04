import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { bookingId, clientName, clientEmail, clientMobile, serviceName, errorReason } = await req.json();

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

        if (!RESEND_API_KEY) {
            return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
        }

        const { Resend } = await import('npm:resend');
        const resend = new Resend(RESEND_API_KEY);
        const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        const subject = `⚠️ Failed Booking: ${clientName || 'Unknown Client'} — ${serviceName || 'Unknown Service'}`;

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
                <h2 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ Unsuccessful Booking Alert</h2>
                <p style="color: #7f1d1d; margin: 0; font-size: 14px;">A client attempted to book but the payment was unsuccessful.</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600; width: 40%;">Booking ID</td>
                    <td style="padding: 10px 0; color: #1e293b;">${bookingId || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Client Name</td>
                    <td style="padding: 10px 0; color: #1e293b;">${clientName || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Client Email</td>
                    <td style="padding: 10px 0; color: #1e293b;">${clientEmail || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Client Mobile</td>
                    <td style="padding: 10px 0; color: #1e293b;">${clientMobile || 'N/A'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Service</td>
                    <td style="padding: 10px 0; color: #1e293b;">${serviceName || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Failure Reason</td>
                    <td style="padding: 10px 0; color: #dc2626;">${errorReason || 'Unknown'}</td>
                </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">You may want to follow up with this client directly.</p>
        </div>`;

        await resend.emails.send({
            from: fromAddress,
            to: ['jacky@hopefordogs.sg'],
            subject,
            html,
        });

        console.log(`✅ Failed booking alert sent for booking ${bookingId}`);
        return Response.json({ success: true });

    } catch (error) {
        console.error('❌ sendFailedBookingAlert error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});