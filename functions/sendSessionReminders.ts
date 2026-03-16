import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function getPreparationTips(serviceType: string): { wa: string; html: string } {
    const tips: Record<string, string[]> = {
        kinder_puppy: [
            "Have your puppy's favorite treats ready",
            "Ensure they're well-rested before the session",
            "Have toys and training equipment handy",
            "Keep the training area clear and distraction-free",
        ],
        basic_manners: [
            "Have high-value treats ready",
            "Ensure your dog has had some exercise beforehand",
            "Have a 6ft leash (non-retractable)",
            "Keep the training area clear",
        ],
        behavioural_modification: [
            "Review notes from previous session",
            "Prepare any questions you have",
            "Have treats and training equipment ready",
            "Ensure a calm environment",
        ],
        canine_assessment: [
            "List any behavioral concerns you've noticed",
            "Note your dog's daily routine",
            "Have your dog well-exercised but not exhausted",
            "Prepare any questions you have",
        ],
    };

    const matchedKey = Object.keys(tips).find((k) => serviceType?.includes(k));
    if (!matchedKey) return { wa: '', html: '' };

    const items = tips[matchedKey];
    const wa = `\n*Preparation Tips:*\n${items.map((t) => `• ${t}`).join('\n')}`;
    const html = `<p><strong>Preparation Tips:</strong></p><ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
    return { wa, html };
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
            for (const session of booking.session_dates) {
                if (session.completed) continue;

                const sessionDate = new Date(session.date + 'T' + session.start_time);
                const timeDiff = sessionDate.getTime() - now.getTime();
                const hoursUntilSession = timeDiff / (1000 * 60 * 60);

                if (hoursUntilSession < 47 || hoursUntilSession > 49) continue;

                const clientMobile = booking.client_mobile ||
                    (booking.clients?.[0]?.client_mobile || booking.clients?.[0]?.clientMobile || '');
                const clientName = booking.client_name ||
                    (booking.clients?.[0]?.client_name || booking.clients?.[0]?.clientName || 'Valued Client');
                const clientEmail = booking.client_email ||
                    (booking.clients?.[0]?.client_email || booking.clients?.[0]?.clientEmail || '');
                const furkidName = booking.furkid_name ||
                    (booking.furkids?.[0]?.furkid_name || 'your furkid');

                const formattedDate = sessionDate.toLocaleDateString('en-SG', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                });

                const prepTips = getPreparationTips(booking.service_type || '');
                const result: any = { booking_id: booking.id, session_number: session.session_number, client_name: clientName, whatsapp: 'skipped', email: 'skipped' };

                // --- WhatsApp ---
                if (booking.whatsapp_consent && clientMobile && clientMobile.startsWith('+') && clientMobile.length >= 8) {
                    const waMessage = `⏰ *Session Reminder*\n\nHi ${clientName}!\n\nThis is a friendly reminder that your training session with ${furkidName} is coming up in 48 hours!\n\n📅 *Session ${session.session_number}*\n🗓️ *Date:* ${formattedDate}\n🕐 *Time:* ${session.start_time} - ${session.end_time}\n🏠 *Service:* ${booking.service_name}${prepTips.wa}\n\nWe're looking forward to seeing you and ${furkidName}! 🐾\n\nIf you need to reschedule, please contact us at +65 8222 8376.\n\n_- Hopefordogs Training Team_ 🐕`;

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
                        result.whatsapp_error = waErr.message;
                    }
                }

                // --- Email ---
                if (resendClient && clientEmail) {
                    try {
                        const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                        await resendClient.emails.send({
                            from: fromAddress,
                            to: [clientEmail],
                            subject: `Session Reminder: ${booking.service_name || 'Training'} — ${formattedDate}`,
                            html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #8b5cf6; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                                    <h1 style="margin: 0; font-size: 24px;">Session Reminder</h1>
                                </div>
                                <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                                    <p>Hi ${clientName},</p>
                                    <p>This is a friendly reminder that your training session with <strong>${furkidName}</strong> is coming up in 48 hours!</p>
                                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                                        <tr><td style="padding: 8px 0; font-weight: bold;">Session</td><td style="padding: 8px 0;">${session.session_number}</td></tr>
                                        <tr><td style="padding: 8px 0; font-weight: bold;">Date</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                                        <tr><td style="padding: 8px 0; font-weight: bold;">Time</td><td style="padding: 8px 0;">${session.start_time} – ${session.end_time}</td></tr>
                                        <tr><td style="padding: 8px 0; font-weight: bold;">Service</td><td style="padding: 8px 0;">${booking.service_name}</td></tr>
                                    </table>
                                    ${prepTips.html}
                                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                                    <p>If you need to reschedule, please contact us at <strong>+65 8222 8376</strong> as soon as possible.</p>
                                    <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
                                </div>
                            </div>`,
                        });
                        result.email = 'sent';
                        if (result.whatsapp !== 'sent') remindersSent++;
                    } catch (emailErr) {
                        result.email = 'failed';
                        result.email_error = emailErr.message;
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