import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'long' });
}

function hasPawsBotanicPromo(serviceType: string): boolean {
    return serviceType.includes('kinder_puppy') ||
        serviceType === 'basic_manners_in_home' ||
        serviceType === 'basic_manners_fyog' ||
        serviceType === 'basic_manners_group_class';
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        const bookings = await base44.asServiceRole.entities.Booking.list();
        const activeBookings = bookings.filter((b: any) =>
            b.booking_status === 'confirmed' &&
            b.session_dates &&
            b.session_dates.length > 0
        );

        const now = new Date();
        let remindersSent = 0;
        const results: any[] = [];

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
        let resendClient: any = null;

        if (RESEND_API_KEY) {
            const { Resend } = await import('npm:resend');
            resendClient = new Resend(RESEND_API_KEY);
        }

        for (const booking of activeBookings) {
            // Track which sessions already had reminders sent (stored as comma-separated string)
            const sentReminders: string[] = (booking.reminders_sent_for || '').split(',').filter(Boolean);

            for (const session of booking.session_dates) {
                if (session.completed) continue;

                const sessionKey = `s${session.session_number}`;
                if (sentReminders.includes(sessionKey)) continue;

                const sessionDate = new Date(session.date + 'T' + session.start_time);
                const timeDiff = sessionDate.getTime() - now.getTime();
                const hoursUntilSession = timeDiff / (1000 * 60 * 60);

                if (hoursUntilSession < 0 || hoursUntilSession > 48) continue;

                const clientMobile = booking.client_mobile ||
                    (booking.clients?.[0]?.client_mobile || booking.clients?.[0]?.clientMobile || '');
                const clientName = booking.client_name ||
                    (booking.clients?.[0]?.client_name || booking.clients?.[0]?.clientName || 'Valued Client');
                const allClientEmails: string[] = [];
                if (booking.client_email) allClientEmails.push(booking.client_email);
                if (booking.clients && booking.clients.length > 0) {
                    for (const c of booking.clients) {
                        const em = c?.client_email || c?.clientEmail || '';
                        if (em && !allClientEmails.includes(em)) allClientEmails.push(em);
                    }
                }
                const furkidName = booking.furkid_name ||
                    (booking.furkids?.[0]?.furkid_name || 'your furkid');

                const serviceType = booking.service_type || '';
                const formattedDate = formatDateLong(session.date);
                const dayOfWeek = getDayOfWeek(session.date);
                const showPromo = hasPawsBotanicPromo(serviceType);

                const result: any = {
                    booking_id: booking.id,
                    session_number: session.session_number,
                    client_name: clientName,
                    whatsapp: 'skipped',
                    email: 'skipped',
                };

                // --- WhatsApp (matches client's template) ---
                if (booking.whatsapp_consent && clientMobile && clientMobile.startsWith('+') && clientMobile.length >= 8) {
                    let waMessage = `Woof!\n\nGentle reminder: you have a session scheduled at ${formattedDate}, ${session.start_time}, ${dayOfWeek}.`;
                    if (showPromo) {
                        waMessage += `\n\nShop for Paws Botanic Pet Grooming Essentials (Promo Code: 20OFFNEW)\nhttps://www.pawsbotanic.co/`;
                    }
                    waMessage += `\n\nKind regards,\nHopefordogs`;

                    try {
                        const conversation = await base44.asServiceRole.agents.createConversation({
                            agent_name: 'booking_assistant',
                            metadata: { booking_id: booking.id, session_number: session.session_number, client_mobile: clientMobile, client_name: clientName, type: 'session_reminder' },
                        });
                        await base44.asServiceRole.agents.addMessage(conversation, { role: 'assistant', content: waMessage });
                        result.whatsapp = 'sent';
                        remindersSent++;
                    } catch (waErr) {
                        result.whatsapp = 'failed';
                    }
                }

                // --- Email ---
                if (resendClient && allClientEmails.length > 0) {
                    try {
                        const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

                        let promoHtml = '';
                        if (showPromo) {
                            promoHtml = `
                            <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
                                <p style="font-size: 14px; color: #92400e; margin: 0;">
                                    🛍️ Shop for <a href="https://www.pawsbotanic.co/" style="color: #b45309; font-weight: 600;">Paws Botanic Pet Grooming Essentials</a><br/>
                                    Promo Code: <strong>20OFFNEW</strong>
                                </p>
                            </div>`;
                        }

                        const pawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 18c-3.5 0-6-2.5-6-5 0-1.7 1-3.2 2.5-4C10 8.3 11 8 12 8s2 .3 3.5 1c1.5.8 2.5 2.3 2.5 4 0 2.5-2.5 5-6 5z"/></svg>`;

                        const reminderSubject = `Session Reminder: ${booking.service_name || 'Training'} — ${formatDateShort(session.date)}`;
                        const reminderHtml = `
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
                                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                                    <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/48f54971a_DogLogonew.png" alt="Hopefordogs" style="height: 20px; width: auto; object-fit: contain; background: white; border-radius: 8px; padding: 8px; margin-bottom: 16px;" />
                                    <h1 style="margin: 0 0 8px 0; font-size: 26px; color: white; font-weight: 700;">Session Reminder</h1>
                                    <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">${booking.service_name || 'Training Session'}</p>
                                </div>

                                <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                                    <p style="font-size: 18px; color: #1e293b; margin: 0 0 16px 0;">Woof! 🐾</p>

                                    <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
                                        Gentle reminder: you have a session scheduled:
                                    </p>

                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">Session</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${session.session_number}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">Date</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${formattedDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">Time</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${session.start_time}${session.end_time ? ' – ' + session.end_time : ''}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #64748b; font-weight: 500;">Day</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #1e293b; font-weight: 600; text-align: right;">${dayOfWeek}</td>
                                            </tr>
                                        </table>
                                    </div>

                                    ${promoHtml}

                                    <p style="font-size: 15px; color: #1e293b; margin: 24px 0 0 0;">
                                        Kind regards,<br/>
                                        Hopefordogs
                                    </p>
                                </div>

                                <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
                                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">HopeForDogs Canine Training</p>
                                    <p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p>
                                    <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
                                        <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
                                        &nbsp;&middot;&nbsp; WhatsApp: +65 8222 8376
                                    </p>
                                </div>
                            </div>`;

                        for (const recipientEmail of allClientEmails) {
                            try {
                                await resendClient.emails.send({
                                    from: fromAddress,
                                    to: [recipientEmail],
                                    subject: reminderSubject,
                                    html: reminderHtml,
                                });
                                console.log(`✅ Reminder email sent to ${recipientEmail}`);
                            } catch (singleErr) {
                                console.error(`⚠️ Reminder to ${recipientEmail} failed:`, singleErr);
                            }
                        }
                        result.email = 'sent';
                        if (result.whatsapp !== 'sent') remindersSent++;
                    } catch (emailErr) {
                        result.email = 'failed';
                    }
                }

                // Mark this session as reminder sent using a simple string field on the booking
                if (result.whatsapp === 'sent' || result.email === 'sent') {
                    try {
                        sentReminders.push(sessionKey);
                        await base44.asServiceRole.entities.Booking.update(booking.id, {
                            reminders_sent_for: sentReminders.join(',')
                        });
                        console.log(`✅ Marked ${sessionKey} of booking ${booking.id} as reminder sent`);
                    } catch (markErr) {
                        console.warn(`⚠️ Could not mark reminder for booking ${booking.id}:`, markErr);
                    }
                }

                results.push(result);
            }
        }

        return Response.json({
            success: true,
            message: `Session reminders processed. ${remindersSent} reminders sent.`,
            reminders_sent: remindersSent,
            details: results,
        });

    } catch (error) {
        console.error('❌ sendSessionReminders error:', error);
        return Response.json({ success: false, error: error.message }, { status: 200 });
    }
});