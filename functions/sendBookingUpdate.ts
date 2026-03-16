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
        const { booking, oldBooking } = await req.json();

        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }

        const { clientMobile, clientName, clientEmail, furkidName } = extractClientInfo(booking);
        const results: { whatsapp: string; email: string } = { whatsapp: 'skipped', email: 'skipped' };

        const isReschedule = oldBooking &&
            JSON.stringify(oldBooking.session_dates) !== JSON.stringify(booking.session_dates);

        let emailSubject = '';
        let emailBody = '';
        let whatsappMessage = '';

        if (isReschedule) {
            let sessionListHtml = '';
            let sessionListWa = '';
            if (booking.session_dates && booking.session_dates.length > 0) {
                sessionListHtml = '<ul>';
                booking.session_dates.forEach((s: any) => {
                    const d = new Date(s.date);
                    const fmt = d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
                    sessionListHtml += `<li>Session ${s.session_number}: ${fmt} at ${s.start_time}</li>`;
                    sessionListWa += `\nSession ${s.session_number}: ${fmt} at ${s.start_time}`;
                });
                sessionListHtml += '</ul>';
            }
            emailSubject = `Sessions Rescheduled: ${booking.service_name || 'Training Service'}`;
            emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f59e0b; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Sessions Rescheduled</h1>
                </div>
                <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Hi ${clientName},</p>
                    <p>Your training sessions for <strong>${furkidName}</strong> have been rescheduled.</p>
                    <p><strong>Updated Schedule:</strong></p>
                    ${sessionListHtml}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p>If you have questions or need further changes, contact us at <strong>+65 8222 8376</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
                </div>
            </div>`;
            whatsappMessage = `🔄 *Session Rescheduled*\n\nHi ${clientName},\n\nYour training sessions for ${furkidName} have been rescheduled.\n*Updated Schedule:*${sessionListWa}\n\nIf you have questions, contact our admin team at +65 8222 8376.\n\n_- Hopefordogs Training Team_ 🐕`;
        } else if (booking.booking_status === 'confirmed' && oldBooking?.booking_status === 'pending') {
            emailSubject = `Booking Confirmed: ${booking.service_name || 'Training Service'}`;
            emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #22c55e; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Booking Confirmed</h1>
                </div>
                <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Hi ${clientName},</p>
                    <p>Your booking for <strong>${booking.service_name}</strong> with <strong>${furkidName}</strong> has been officially confirmed.</p>
                    <p>We're all set and looking forward to your first session!</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p>If you have questions, contact us at <strong>+65 8222 8376</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
                </div>
            </div>`;
            whatsappMessage = `✅ *Booking Confirmed*\n\nHi ${clientName},\n\nGreat news! Your booking for *${booking.service_name}* with ${furkidName} has been officially confirmed.\n\nWe're looking forward to your first session!\n\n_- Hopefordogs Training Team_ 🐕`;
        } else {
            emailSubject = `Booking Updated: ${booking.service_name || 'Training Service'}`;
            emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #3b82f6; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; font-size: 24px;">Booking Updated</h1>
                </div>
                <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                    <p>Hi ${clientName},</p>
                    <p>Your booking for <strong>${booking.service_name}</strong> with <strong>${furkidName}</strong> has been updated.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                    <p>For details or questions, contact our team at <strong>+65 8222 8376</strong>.</p>
                    <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
                </div>
            </div>`;
            whatsappMessage = `📝 *Booking Updated*\n\nHi ${clientName},\n\nYour booking for *${booking.service_name}* with ${furkidName} has been updated.\n\nFor details or questions, contact our team at +65 8222 8376.\n\n_- Hopefordogs Training Team_ 🐕`;
        }

        // --- WhatsApp ---
        if (booking.whatsapp_consent && clientMobile && clientMobile.startsWith('+') && clientMobile.length >= 8) {
            try {
                const conversation = await base44.asServiceRole.agents.createConversation({
                    agent_name: 'booking_assistant',
                    metadata: { booking_id: booking.id, client_mobile: clientMobile, client_name: clientName, type: 'booking_update' },
                });
                await base44.asServiceRole.agents.addMessage(conversation, { role: 'assistant', content: whatsappMessage });
                results.whatsapp = 'sent';
                console.log(`✅ WhatsApp update sent to ${clientMobile}`);
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
                    subject: emailSubject,
                    html: emailBody,
                });
                results.email = 'sent';
                console.log(`✅ Update email sent to ${clientEmail}`);
            } catch (emailError) {
                console.error('⚠️ Email failed:', emailError);
                results.email = 'failed';
            }
        }

        return Response.json({ success: true, booking_id: booking.id, notifications: results });

    } catch (error) {
        console.error('❌ sendBookingUpdate error:', error);
        return Response.json({ success: false, error: error.message }, { status: 200 });
    }
});