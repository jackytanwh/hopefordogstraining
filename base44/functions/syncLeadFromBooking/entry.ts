import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) {
      return Response.json({ message: 'No booking data' }, { status: 400 });
    }

    // Extract client name and email
    let clientName, clientEmail, dogDob;

    if (booking.clients && booking.clients.length > 0) {
      clientName = booking.clients[0].client_name;
      clientEmail = booking.clients[0].client_email;
    } else {
      clientName = booking.client_name;
      clientEmail = booking.client_email;
    }

    if (booking.furkids && booking.furkids.length > 0) {
      dogDob = booking.furkids[0].furkid_dob;
    } else {
      dogDob = booking.furkid_dob;
    }

    if (!clientName || !clientEmail) {
      return Response.json({ message: 'Missing client info, skipping' });
    }

    await base44.asServiceRole.entities.LeadInquiry.create({
      client_name: clientName,
      email_address: clientEmail,
      dog_dob: dogDob || null
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});