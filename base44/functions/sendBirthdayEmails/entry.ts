import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildBirthdayEmailHtml(clientName, furkidName, unsubscribeUrl) {
    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/981c2d0c1_DogLogonewSmallCustom.png" alt="Hopefordogs" style="height: 60px; width: auto; object-fit: contain; margin-bottom: 16px;" />
            <h1 style="margin: 0 0 8px 0; font-size: 26px; color: white; font-weight: 700;">🎉 Birthday Coming Up! 🐾</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">A special treat for ${furkidName}</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${clientName}</strong>,</p>

            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
                <strong>${furkidName}</strong>'s birthday is coming up, and we're excited to celebrate this special occasion with you! 🎉🐾
            </p>

            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px 0;">
                To make the celebration even more memorable, we've prepared some exclusive birthday promotions specially for <strong>${furkidName}</strong>. Wishing <strong>${furkidName}</strong> a wonderful birthday filled with love, tasty treats, and lots of happy moments! ❤️
            </p>

            <!-- Paws Botanic Promo -->
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 0 0 16px 0;">
                <p style="font-size: 16px; font-weight: 700; color: #15803d; margin: 0 0 6px 0;">🛍️ 30% off Paws Botanic Pet Grooming Essentials</p>
                <p style="font-size: 14px; color: #166534; margin: 0 0 12px 0;">Exclusive promo code: <strong style="font-size: 16px; letter-spacing: 1px;">BDAY30</strong></p>
                <a href="https://www.pawsbotanic.co/" style="display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Shop Now →</a>
            </div>

            <!-- Pets' Delight Promo -->
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin: 0 0 16px 0;">
                <p style="font-size: 16px; font-weight: 700; color: #c2410c; margin: 0 0 6px 0;">🎂 10% off all cake orders at Pets' Delight</p>
                <p style="font-size: 14px; color: #9a3412; margin: 0 0 4px 0;">No minimum spend required!</p>
                <p style="font-size: 14px; color: #9a3412; margin: 0 0 12px 0;">Exclusive promo code: <strong style="font-size: 16px; letter-spacing: 1px;">HOPEFORDOGS10</strong></p>
                <a href="https://petsdelight.sg/" style="display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Shop Now →</a>
            </div>

            <!-- Hopefordogs Store Promo -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
                <p style="font-size: 16px; font-weight: 700; color: #1d4ed8; margin: 0 0 6px 0;">🏪 10% off all eligible items at Hopefordogs Online Store</p>
                <p style="font-size: 14px; color: #1e40af; margin: 0 0 12px 0;">Exclusive promo code: <strong style="font-size: 16px; letter-spacing: 1px;">BDAY10</strong></p>
                <a href="https://www.hopefordogs.sg/shop/" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">Shop Now →</a>
            </div>

            <p style="font-size: 15px; color: #1e293b; margin: 20px 0 0 0;">
                Warmest Regards,<br/>
                <strong>Hopefordogs Canine Training</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">Hopefordogs Canine Training</p>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
                <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
                &nbsp;·&nbsp; WhatsApp: +65 8222 8376
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
                Don't want to receive birthday emails?
                <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe here</a>
            </p>
        </div>
    </div>`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");
        const APP_DOMAIN = Deno.env.get("APP_DOMAIN") || 'https://bookings.hopefordogs.sg';

        if (!RESEND_API_KEY) {
            return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
        }

        const { Resend } = await import('npm:resend');
        const resend = new Resend(RESEND_API_KEY);
        const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';

        // Get today's date in Singapore time
        const now = new Date();
        const sgOffset = 8 * 60 * 60 * 1000;
        const sgNow = new Date(now.getTime() + sgOffset);

        // Target: birthdays exactly 7 days from today
        const targetDate = new Date(sgNow.getTime() + 7 * 24 * 60 * 60 * 1000);
        const targetMonth = targetDate.getUTCMonth() + 1; // 1-based
        const targetDay = targetDate.getUTCDate();

        // Fetch all leads with email and dog_dob, not unsubscribed
        const allLeads = await base44.asServiceRole.entities.LeadInquiry.list();

        const eligible = allLeads.filter(lead => {
            if (!lead.email_address || !lead.dog_dob || lead.unsubscribed) return false;
            const dob = new Date(lead.dog_dob);
            return (dob.getUTCMonth() + 1) === targetMonth && dob.getUTCDate() === targetDay;
        });

        console.log(`Found ${eligible.length} clients with birthdays on ${targetMonth}/${targetDay} (7 days from now)`);

        const results = [];
        for (const lead of eligible) {
            const clientName = lead.client_name || 'Valued Client';
            const furkidName = lead.furkid_name || 'your furkid';
            const unsubscribeUrl = `${APP_DOMAIN}/unsubscribe?id=${lead.id}`;

            try {
                await resend.emails.send({
                    from: fromAddress,
                    to: [lead.email_address],
                    subject: `A Special Birthday Treat for ${furkidName}!`,
                    html: buildBirthdayEmailHtml(clientName, furkidName, unsubscribeUrl),
                });
                results.push({ id: lead.id, email: lead.email_address, status: 'sent' });
                console.log(`✅ Birthday email sent to ${lead.email_address} for ${furkidName}`);
            } catch (err) {
                results.push({ id: lead.id, email: lead.email_address, status: 'failed', error: err.message });
                console.error(`❌ Failed for ${lead.email_address}:`, err.message);
            }
        }

        return Response.json({ success: true, sent: results.filter(r => r.status === 'sent').length, results });

    } catch (error) {
        console.error('❌ sendBirthdayEmails error:', error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});