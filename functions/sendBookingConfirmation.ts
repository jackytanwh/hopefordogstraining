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

function buildConfirmationEmailHtml(booking: any, clientName: string, furkidName: string): string {
    let sessionHtml = '';
    if (booking.session_dates && booking.session_dates.length > 0) {
        const first = booking.session_dates[0];
        const d = new Date(first.date);
        const formatted = d.toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        sessionHtml = `<p><strong>First Session:</strong> ${formatted} at ${first.start_time}</p>`;
        if (booking.session_dates.length > 1) {
            sessionHtml += `<p><strong>Total Sessions:</strong> ${booking.session_dates.length}</p>`;
        }
    }

    const totalPrice = Number(booking.total_price || 0).toFixed(2);

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Booking Confirmed!</h1>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hi ${clientName},</p>
            <p>Great news! Your booking for <strong>${booking.service_name || 'Training Service'}</strong> with <strong>${furkidName}</strong> has been confirmed.</p>
            ${sessionHtml}
            <p><strong>Amount Paid:</strong> SGD ${totalPrice}</p>
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p>Our team will contact you within 24 hours with further instructions.</p>
            <p>If you need to reschedule, please contact our admin team at <strong>+65 8222 8376</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">— Hope For Dogs Training Team</p>
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
                    html: buildConfirmationEmailHtml(booking, clientName, furkidName),
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