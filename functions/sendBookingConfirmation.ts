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

function formatSessionDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function buildConfirmationEmailHtml(booking: any, clientName: string, furkidName: string, clientEmail: string): string {
    const totalPrice = Number(booking.total_price || 0).toFixed(2);
    const serviceName = booking.service_name || 'Training Service';

    const pawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 18c-3.5 0-6-2.5-6-5 0-1.7 1-3.2 2.5-4C10 8.3 11 8 12 8s2 .3 3.5 1c1.5.8 2.5 2.3 2.5 4 0 2.5-2.5 5-6 5z"/></svg>`;

    // Build sessions table rows
    let sessionsHtml = '';
    if (booking.session_dates && booking.session_dates.length > 0) {
        const sessionRows = booking.session_dates.map((s: any) => `
            <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">
                    Session ${s.session_number}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">
                    ${formatSessionDate(s.date)}
                </td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">
                    ${s.start_time}${s.end_time ? ' – ' + s.end_time : ''}
                </td>
            </tr>`).join('');

        sessionsHtml = `
        <div style="margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e293b;">📅 Your Sessions</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Session</th>
                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Date</th>
                        <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessionRows}
                </tbody>
            </table>
        </div>`;
    }

    // Build pricing breakdown
    let pricingRows = '';
    if (booking.adoption_discount > 0) {
        pricingRows += `<tr><td style="padding: 6px 0; color: #16a34a; font-size: 14px;">Adoption Discount</td><td style="padding: 6px 0; text-align: right; color: #16a34a; font-size: 14px;">-$${Number(booking.adoption_discount).toFixed(2)}</td></tr>`;
    }
    if (booking.weekend_surcharge > 0) {
        pricingRows += `<tr><td style="padding: 6px 0; color: #475569; font-size: 14px;">Weekend Surcharge</td><td style="padding: 6px 0; text-align: right; color: #475569; font-size: 14px;">+$${Number(booking.weekend_surcharge).toFixed(2)}</td></tr>`;
    }
    if (booking.total_sentosa_surcharge > 0) {
        pricingRows += `<tr><td style="padding: 6px 0; color: #475569; font-size: 14px;">Sentosa Surcharge</td><td style="padding: 6px 0; text-align: right; color: #475569; font-size: 14px;">+$${Number(booking.total_sentosa_surcharge).toFixed(2)}</td></tr>`;
    }

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
        <!-- Header with paw logo -->
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="display: inline-block; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 16px; margin-bottom: 16px;">
                ${pawSvg}
            </div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; color: white; font-weight: 700;">Payment Successful!</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your booking has been confirmed</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
            <!-- Thank you message -->
            <div style="text-align: center; margin-bottom: 24px;">
                <p style="font-size: 18px; color: #334155; margin: 0 0 4px 0;">
                    Thank you, <strong>${clientName}${furkidName !== 'your furkid' ? ' & ' + furkidName : ''}</strong>!
                </p>
                ${clientEmail ? `<p style="font-size: 14px; color: #64748b; margin: 0;">A confirmation email has been sent to ${clientEmail}</p>` : ''}
            </div>

            <!-- Service card -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
                <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #0f172a; font-weight: 700;">${serviceName}</h2>
                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Booking ID: ${booking.id}</p>

                ${sessionsHtml}

                <!-- Pricing -->
                <div style="border-top: 2px solid #e2e8f0; margin-top: 20px; padding-top: 16px;">
                    ${pricingRows ? `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">${pricingRows}</table>` : ''}
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-size: 16px; color: #475569; font-weight: 600;">Total Paid</td>
                            <td style="padding: 8px 0; text-align: right; font-size: 28px; color: #16a34a; font-weight: 700;">$${totalPrice}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- What's Next -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-top: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1e40af; font-weight: 700;">What's Next?</h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                    <li>Our team will contact you within 24 hours</li>
                    <li>Please have treats ready for training</li>
                    <li>If you need to reschedule, contact us at <strong>+65 8222 8376</strong></li>
                </ul>
            </div>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">🐾 Hope For Dogs Training</p>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">Canine Training &amp; Behaviour Specialists</p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
                <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
                &nbsp;·&nbsp; +65 8222 8376
            </p>
        </div>
    </div>`;
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
            let sessionDetails = '';
            if (booking.session_dates && booking.session_dates.length > 0) {
                const first = booking.session_dates[0];
                const d = new Date(first.date);
                const formatted = d.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                sessionDetails = `\n📅 *First Session:* ${formatted} at ${first.start_time}`;
                if (booking.session_dates.length > 1) sessionDetails += `\n📋 *Total Sessions:* ${booking.session_dates.length}`;
            }

            let pricingDetails = '';
            if (booking.total_price) {
                pricingDetails = `\n💰 *Total Amount:* $${booking.total_price.toFixed(2)}`;
                if (booking.adoption_discount > 0) pricingDetails += `\n   - Adoption Discount: -$${booking.adoption_discount.toFixed(2)}`;
                if (booking.weekend_surcharge > 0) pricingDetails += `\n   - Weekend Surcharge: +$${booking.weekend_surcharge.toFixed(2)}`;
                if (booking.total_sentosa_surcharge > 0) pricingDetails += `\n   - Sentosa Surcharge: +$${booking.total_sentosa_surcharge.toFixed(2)}`;
            }

            const message = `🎉 *Booking Confirmed!*\n\nHi ${clientName}!\n\nGreat news! Your booking for *${booking.service_name}* with ${furkidName} has been confirmed! 🐾${sessionDetails}${pricingDetails}\n\nOur team will contact you within 24 hours with further instructions.\n\nIf you need to reschedule, please contact our admin team at +65 8222 8376.\n\n_- Hopefordogs Training Team_ 🐕`;

            try {
                const conversation = await base44.asServiceRole.agents.createConversation({
                    agent_name: 'booking_assistant',
                    metadata: { booking_id: booking.id, client_mobile: clientMobile, client_name: clientName, type: 'booking_confirmation' },
                });
                await base44.asServiceRole.agents.addMessage(conversation, { role: 'assistant', content: message });
                results.whatsapp = 'sent';
                console.log(`✅ WhatsApp confirmation sent to ${clientMobile}`);
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
                    subject: `Booking Confirmed: ${booking.service_name || 'Training Service'}`,
                    html: buildConfirmationEmailHtml(booking, clientName, furkidName, clientEmail),
                });
                results.email = 'sent';
                console.log(`✅ Confirmation email sent to ${clientEmail}`);
            } catch (emailError) {
                console.error('⚠️ Email failed:', emailError);
                results.email = 'failed';
            }
        }

        return Response.json({ success: true, booking_id: booking.id, notifications: results });

    } catch (error) {
        console.error('❌ sendBookingConfirmation error:', error);
        return Response.json({ success: false, error: error.message, note: 'Booking was still created successfully' }, { status: 200 });
    }
});