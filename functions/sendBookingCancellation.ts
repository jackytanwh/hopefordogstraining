import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function extractClientInfo(booking: any) {
    let clientMobile = booking.client_mobile || '';
    let clientName = booking.client_name || '';
    let clientEmail = booking.client_email || '';
    let furkidName = booking.furkid_name || '';

    if (booking.clients && booking.clients.length > 0) {
        for (const c of booking.clients) {
            if (!c) continue;
            if (!clientMobile) clientMobile = c.client_mobile || c.clientMobile || '';
            if (!clientName) clientName = c.client_name || c.clientName || '';
            if (!clientEmail) clientEmail = c.client_email || c.clientEmail || '';
        }
    }

    if (!furkidName && booking.furkids && booking.furkids.length > 0) {
        const f = booking.furkids.find((fk: any) => fk?.furkid_name);
        if (f) furkidName = f.furkid_name;
    }

    return {
        clientMobile,
        clientName: clientName || 'Valued Client',
        clientEmail,
        furkidName: furkidName || 'your furkid',
    };
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { booking } = await req.json();

        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }

        const { clientMobile, clientName, clientEmail, furkidName } = extractClientInfo(booking);
        const results: { whatsapp: string; email: string } = { whatsapp: 'skipped', email: 'skipped' };

        // --- WhatsApp ---
        if (booking.whatsapp_consent && clientMobile && clientMobile.startsWith('+') && clientMobile.length >= 8) {
            const message = `❌ *Booking Cancelled*\n\nHi ${clientName},\n\nWe're writing to confirm that your booking for *${booking.service_name}* with ${furkidName} has been cancelled.\n\nIf this was done in error or if you'd like to reschedule, please contact our admin team at +65 8222 8376. We'd be happy to help you find a new slot!\n\nWe hope to see you and ${furkidName} again soon! 🐾\n\n_- Hopefordogs Training Team_ 🐕`;

            try {
                const conversation = await base44.asServiceRole.agents.createConversation({
                    agent_name: 'booking_assistant',
                    metadata: { booking_id: booking.id, client_mobile: clientMobile, client_name: clientName, type: 'booking_cancellation' },
                });
                await base44.asServiceRole.agents.addMessage(conversation, { role: 'assistant', content: message });
                results.whatsapp = 'sent';
                console.log(`✅ WhatsApp cancellation sent to ${clientMobile}`);
            } catch (waError) {
                console.warn('⚠️ WhatsApp failed:', waError.message);
                results.whatsapp = 'failed';
            }
        }

        // --- Resend Email ---
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

        if (RESEND_API_KEY && clientEmail) {
            try {
                const { Resend } = await import('npm:resend');
                const resend = new Resend(RESEND_API_KEY);
                const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                await resend.emails.send({
                    from: fromAddress,
                    to: [clientEmail],
                    subject: `Booking Cancelled: ${booking.service_name || 'Training Service'}`,
                    html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: #ef4444; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 24px;">Booking Cancelled</h1>
                        </div>
                        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                            <p>Hi ${clientName},</p>
                            <p>Your booking for <strong>${booking.service_name || 'Training Service'}</strong> with <strong>${furkidName}</strong> has been cancelled.</p>
                            <p><strong>Booking ID:</strong> ${booking.id}</p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                            <p>If this was done in error or if you'd like to reschedule, please contact our admin team at <strong>+65 8222 8376</strong>.</p>
                            <p>We hope to see you and ${furkidName} again soon!</p>
                            <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
                        </div>
                    </div>`,
                });
                results.email = 'sent';
                console.log(`✅ Cancellation email sent to ${clientEmail}`);
            } catch (emailError) {
                console.error('⚠️ Email failed:', emailError);
                results.email = 'failed';
            }
        }

        return Response.json({ success: true, booking_id: booking.id, notifications: results });

    } catch (error) {
        console.error('❌ sendBookingCancellation error:', error);
        return Response.json({ success: false, error: error.message }, { status: 200 });
    }
});