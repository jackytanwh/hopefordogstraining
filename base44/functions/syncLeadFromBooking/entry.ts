import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const booking = payload.data;
    if (!booking) {
      return Response.json({ message: 'No booking data' }, { status: 400 });
    }

    // Extract client info
    let clientName, clientEmail, clientMobile, dogDob, dogAge, furkidName;

    if (booking.clients && booking.clients.length > 0) {
      clientName = booking.clients[0].client_name;
      clientEmail = booking.clients[0].client_email;
      clientMobile = booking.clients[0].client_mobile;
    } else {
      clientName = booking.client_name;
      clientEmail = booking.client_email;
      clientMobile = booking.client_mobile;
    }

    if (booking.furkids && booking.furkids.length > 0) {
      dogDob = booking.furkids[0].furkid_dob;
      dogAge = booking.furkids[0].furkid_age;
      furkidName = booking.furkids[0].furkid_name;
    } else {
      dogDob = booking.furkid_dob;
      dogAge = booking.furkid_age;
      furkidName = booking.furkid_name;
    }

    if (!clientName || !clientEmail) {
      return Response.json({ message: 'Missing client info, skipping' });
    }

    await base44.asServiceRole.entities.LeadInquiry.create({
      client_name: clientName,
      email_address: clientEmail,
      mobile_number: clientMobile || null,
      furkid_name: furkidName || null,
      dog_dob: dogDob || null,
      dog_age: dogAge || null
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});