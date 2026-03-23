import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function extractClientInfo(booking: any) {
    let clientMobile = booking.client_mobile || '';
    let clientName = booking.client_name || '';
    let furkidName = booking.furkid_name || '';

    const allEmails: string[] = [];
    if (booking.client_email) allEmails.push(booking.client_email);

    if (booking.clients && booking.clients.length > 0) {
        for (const c of booking.clients) {
            if (!c) continue;
            if (!clientMobile) clientMobile = c.client_mobile || c.clientMobile || '';
            if (!clientName) clientName = c.client_name || c.clientName || '';
            const email = c.client_email || c.clientEmail || '';
            if (email && !allEmails.includes(email)) allEmails.push(email);
        }
    }

    if (!furkidName && booking.furkids && booking.furkids.length > 0) {
        const f = booking.furkids.find((fk: any) => fk?.furkid_name);
        if (f) furkidName = f.furkid_name;
    }

    return {
        clientMobile,
        clientName: clientName || 'Valued Client',
        clientEmail: allEmails[0] || '',
        allClientEmails: allEmails,
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

        const { clientMobile, clientName, allClientEmails, furkidName } = extractClientInfo(booking);
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

        if (RESEND_API_KEY && allClientEmails.length > 0) {
            try {
                const { Resend } = await import('npm:resend');
                const resend = new Resend(RESEND_API_KEY);
                const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const cancelHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
                        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                            <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 18c-3.5 0-6-2.5-6-5 0-1.7 1-3.2 2.5-4C10 8.3 11 8 12 8s2 .3 3.5 1c1.5.8 2.5 2.3 2.5 4 0 2.5-2.5 5-6 5z"/></svg>
                            </div>
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; color: white; font-weight: 700;">Booking Cancelled</h1>
                            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">We're sorry to see this booking go</p>
                        </div>
                        <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                            <p style="font-size: 16px; color: #334155;">Hi ${clientName},</p>
                            <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your booking for <strong>${booking.service_name || 'Training Service'}</strong> with <strong>${furkidName}</strong> has been cancelled.</p>
                            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Service</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px; font-weight: 600;">${booking.service_name || 'Training Service'}</td></tr>
                                    <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Booking ID</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px;">${booking.id}</td></tr>
                                    ${booking.total_price ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Amount</td><td style="padding: 6px 0; text-align: right; color: #ef4444; font-size: 14px; font-weight: 600;">$${Number(booking.total_price).toFixed(2)}</td></tr>` : ''}
                                </table>
                            </div>
                            <p style="font-size: 15px; color: #475569; line-height: 1.6;">If this was done in error or if you'd like to reschedule, please contact our admin team at <strong>+65 8222 8376</strong>.</p>
                            <p style="font-size: 15px; color: #475569;">We hope to see you and ${furkidName} again soon! 🐾</p>
                        </div>
                        <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
                            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">🐾 Hope For Dogs Training</p>
                            <p style="margin: 0; font-size: 13px; color: #94a3b8;">Canine Training &amp; Behaviour Specialists</p>
                            <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"><a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a> &middot; +65 8222 8376</p>
                        </div>
                    </div>`;

                for (const recipientEmail of allClientEmails) {
                    try {
                        await resend.emails.send({
                            from: fromAddress,
                            to: [recipientEmail],
                            subject: `Booking Cancelled: ${booking.service_name || 'Training Service'}`,
                            html: cancelHtml,
                        });
                        console.log(`✅ Cancellation email sent to ${recipientEmail}`);
                    } catch (singleErr) {
                        console.error(`⚠️ Email to ${recipientEmail} failed:`, singleErr);
                    }
                }
                results.email = 'sent';
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