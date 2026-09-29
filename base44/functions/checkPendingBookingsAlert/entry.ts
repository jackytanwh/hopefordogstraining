import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const ALERT_EMAIL = 'jacky@hopefordogs.sg';

function formatDateTime(d) {
  return new Date(d).toLocaleString('en-SG', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const pending = await base44.asServiceRole.entities.Booking.filter({ booking_status: 'pending' });

    // Bookings pending for more than 1 hour that haven't triggered an alert yet
    const stale = pending.filter(b =>
      b.created_date && b.created_date < cutoff && !b.pending_alert_sent_at
    );

    if (stale.length === 0) {
      return Response.json({ ok: true, stale_count: 0, message: 'No bookings pending for more than 1 hour.' });
    }

    const rows = stale.map(b => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;">${b.service_name || 'Service'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${b.client_name || b.clients?.[0]?.client_name || '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${b.client_email || b.clients?.[0]?.client_email || '-'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">${formatDateTime(b.created_date)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155;">$${(b.total_price ?? 0).toFixed(2)}</td>
      </tr>
    `).join('');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: ALERT_EMAIL,
      subject: `Action needed: ${stale.length} booking${stale.length > 1 ? 's' : ''} pending for more than 1 hour`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f1f5f9;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/981c2d0c1_DogLogonewSmallCustom.png" alt="Hopefordogs" style="height: 56px; width: auto; object-fit: contain; margin-bottom: 12px;" />
            <h1 style="margin: 0; font-size: 22px; color: white; font-weight: 700;">Pending Booking Alert</h1>
          </div>
          <div style="background: white; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">
              The following <strong>${stale.length}</strong> booking${stale.length > 1 ? 's have' : ' has'} been pending for more than <strong>1 hour</strong> (payment not completed):
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">Service</th>
                  <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">Client</th>
                  <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">Email</th>
                  <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">Booked At</th>
                  <th style="text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b;">Amount</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="font-size: 13px; color: #64748b; margin: 16px 0 0 0;">
              Please review these bookings in the admin dashboard and follow up with the clients.
            </p>
          </div>
        </div>
      `
    });

    // Mark bookings so they only trigger one alert each
    await base44.asServiceRole.entities.Booking.bulkUpdate(
      stale.map(b => ({ id: b.id, pending_alert_sent_at: new Date().toISOString() }))
    );

    return Response.json({ ok: true, stale_count: stale.length, alerted: stale.map(b => b.id) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}