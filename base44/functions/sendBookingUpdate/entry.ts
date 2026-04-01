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
        const { booking, oldBooking } = await req.json();

        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }

        const { clientMobile, clientName, allClientEmails, furkidName } = extractClientInfo(booking);
        const results: { whatsapp: string; email: string } = { whatsapp: 'skipped', email: 'skipped' };

        const isReschedule = oldBooking &&
            JSON.stringify(oldBooking.session_dates) !== JSON.stringify(booking.session_dates);

        let whatsappMessage = '';

        const pawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 18c-3.5 0-6-2.5-6-5 0-1.7 1-3.2 2.5-4C10 8.3 11 8 12 8s2 .3 3.5 1c1.5.8 2.5 2.3 2.5 4 0 2.5-2.5 5-6 5z"/></svg>`;
        const footerHtml = `<div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;"><p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">Hopefordogs Canine Training</p><p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p><p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;"><a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a> &middot; WhatsApp: +65 8222 8376</p></div>`;

        let sessionTableRows = '';
        let sessionListWa = '';
        if (isReschedule && booking.session_dates && booking.session_dates.length > 0) {
            booking.session_dates.forEach((s: any) => {
                const d = new Date(s.date);
                const fmt = d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                sessionTableRows += `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">Session ${s.session_number}</td><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">${fmt}</td><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">${s.start_time}${s.end_time ? ' – ' + s.end_time : ''}</td></tr>`;
                sessionListWa += `\nSession ${s.session_number}: ${fmt} at ${s.start_time}`;
            });
        }

        // Build email subject + body builder (personalized per client name + dog name)
        let emailSubject = '';
        let buildEmailBody: (name: string, dog: string) => string;

        if (isReschedule) {
            emailSubject = `Sessions Rescheduled: ${booking.service_name || 'Training Service'}`;
            buildEmailBody = (name: string, dog: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">${pawSvg}</div>
                    <h1 style="margin: 0 0 8px 0; font-size: 28px; color: white; font-weight: 700;">Sessions Rescheduled</h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your training schedule has been updated</p>
                </div>
                <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="font-size: 16px; color: #334155;">Hi ${name},</p>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your training sessions for <strong>${dog}</strong> have been rescheduled. Here is your updated schedule:</p>
                    <div style="margin: 24px 0;">
                        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                            <thead><tr style="background: #f8fafc;"><th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Session</th><th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Date</th><th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Time</th></tr></thead>
                            <tbody>${sessionTableRows}</tbody>
                        </table>
                    </div>
                    <p style="font-size: 15px; color: #475569;">If you have questions or need further changes, contact us at <strong>+65 8222 8376</strong>.</p>
                </div>
                ${footerHtml}
            </div>`;
            whatsappMessage = `🔄 *Session Rescheduled*\n\nHi ${clientName},\n\nYour training sessions for ${furkidName} have been rescheduled.\n*Updated Schedule:*${sessionListWa}\n\nIf you have questions, contact our admin team at +65 8222 8376.\n\n_- Hopefordogs Training Team_ 🐕`;
        } else if (booking.booking_status === 'confirmed' && oldBooking?.booking_status === 'pending') {
            emailSubject = `Booking Confirmed: ${booking.service_name || 'Training Service'}`;
            buildEmailBody = (name: string, dog: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
                <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">${pawSvg}</div>
                    <h1 style="margin: 0 0 8px 0; font-size: 28px; color: white; font-weight: 700;">Booking Confirmed</h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your booking has been officially confirmed</p>
                </div>
                <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="font-size: 16px; color: #334155;">Hi ${name},</p>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your booking for <strong>${booking.service_name}</strong> with <strong>${dog}</strong> has been officially confirmed by our team.</p>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Service</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px; font-weight: 600;">${booking.service_name}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Booking ID</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px;">${booking.id}</td></tr>
                            ${booking.total_price ? `<tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Amount</td><td style="padding: 6px 0; text-align: right; color: #16a34a; font-size: 20px; font-weight: 700;">$${Number(booking.total_price).toFixed(2)}</td></tr>` : ''}
                        </table>
                    </div>
                    <p style="font-size: 15px; color: #475569;">We're all set and looking forward to your first session! If you have questions, contact us at <strong>+65 8222 8376</strong>.</p>
                </div>
                ${footerHtml}
            </div>`;
            whatsappMessage = `✅ *Booking Confirmed*\n\nHi ${clientName},\n\nGreat news! Your booking for *${booking.service_name}* with ${furkidName} has been officially confirmed.\n\nWe're looking forward to your first session!\n\n_- Hopefordogs Training Team_ 🐕`;
        } else {
            emailSubject = `Booking Updated: ${booking.service_name || 'Training Service'}`;
            buildEmailBody = (name: string, dog: string) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">${pawSvg}</div>
                    <h1 style="margin: 0 0 8px 0; font-size: 28px; color: white; font-weight: 700;">Booking Updated</h1>
                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">Changes have been made to your booking</p>
                </div>
                <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="font-size: 16px; color: #334155;">Hi ${name},</p>
                    <p style="font-size: 15px; color: #475569; line-height: 1.6;">Your booking for <strong>${booking.service_name}</strong> with <strong>${dog}</strong> has been updated.</p>
                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Service</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px; font-weight: 600;">${booking.service_name}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-size: 14px;">Booking ID</td><td style="padding: 6px 0; text-align: right; color: #334155; font-size: 14px;">${booking.id}</td></tr>
                        </table>
                    </div>
                    <p style="font-size: 15px; color: #475569;">For details or questions, contact our team at <strong>+65 8222 8376</strong>.</p>
                </div>
                ${footerHtml}
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

        if (RESEND_API_KEY && allClientEmails.length > 0) {
            try {
                const { Resend } = await import('npm:resend');
                const resend = new Resend(RESEND_API_KEY);
                const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const sentTo: string[] = [];
                const hasMultipleClients = booking.clients && booking.clients.length > 1;

                if (hasMultipleClients) {
                    for (let i = 0; i < booking.clients.length; i++) {
                        const c = booking.clients[i];
                        if (!c) continue;
                        const cEmail = c.client_email || c.clientEmail || '';
                        if (!cEmail) continue;
                        const cName = c.client_name || c.clientName || 'Valued Client';
                        const cFurkid = booking.furkids?.[i]?.furkid_name || furkidName;
                        try {
                            await resend.emails.send({
                                from: fromAddress,
                                to: [cEmail],
                                subject: emailSubject,
                                html: buildEmailBody(cName, cFurkid),
                            });
                            sentTo.push(cEmail);
                            console.log(`✅ Personalized update email sent to ${cEmail} (${cName} & ${cFurkid})`);
                        } catch (singleErr) {
                            console.error(`⚠️ Email to ${cEmail} failed:`, singleErr);
                        }
                    }
                } else {
                    const recipientEmail = allClientEmails[0];
                    try {
                        await resend.emails.send({
                            from: fromAddress,
                            to: [recipientEmail],
                            subject: emailSubject,
                            html: buildEmailBody(clientName, furkidName),
                        });
                        sentTo.push(recipientEmail);
                        console.log(`✅ Update email sent to ${recipientEmail}`);
                    } catch (singleErr) {
                        console.error(`⚠️ Email to ${recipientEmail} failed:`, singleErr);
                    }
                }

                results.email = sentTo.length > 0 ? 'sent' : 'failed';
                console.log(`✅ Update emails sent to ${sentTo.length} recipient(s)`);
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