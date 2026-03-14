import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { booking, oldBooking, updateType } = await req.json();
        
        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }
        
        if (!booking.whatsapp_consent) {
            return Response.json({ 
                success: false,
                message: 'Client did not consent to WhatsApp notifications' 
            }, { status: 200 });
        }
        
        let clientMobile = booking.client_mobile;
        let clientName = booking.client_name || 'Valued Client';
        let furkidName = booking.furkid_name || 'your furkid';
        
        if (!clientMobile && booking.clients && booking.clients.length > 0) {
            const clientWithMobile = booking.clients.find(c => c && c.client_mobile);
            if (clientWithMobile) {
                clientMobile = clientWithMobile.client_mobile;
                clientName = clientWithMobile.client_name || clientName;
            }
        }
        
        if (!furkidName || furkidName === 'your furkid') {
            if (booking.furkids && booking.furkids.length > 0) {
                const furkidWithName = booking.furkids.find(f => f && f.furkid_name);
                if (furkidWithName) {
                    furkidName = furkidWithName.furkid_name;
                }
            }
        }
        
        if (!clientMobile) {
            return Response.json({ 
                success: false,
                message: 'No client mobile number found',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        if (!clientMobile.startsWith('+') || clientMobile.length < 8) {
            return Response.json({ 
                success: false,
                message: 'Invalid mobile number format',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        let message = '';
        
        const isReschedule = oldBooking && 
                            JSON.stringify(oldBooking.session_dates) !== JSON.stringify(booking.session_dates);
        
        if (isReschedule) {
            let sessionDetails = '';
            if (booking.session_dates && booking.session_dates.length > 0) {
                sessionDetails = '\n*Updated Schedule:*\n';
                booking.session_dates.forEach((session, index) => {
                    const sessionDate = new Date(session.date);
                    const formattedDate = sessionDate.toLocaleDateString('en-SG', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    sessionDetails += `\nSession ${session.session_number}: ${formattedDate} at ${session.start_time}`;
                });
            }
            
            message = `🔄 *Session Rescheduled*

Hi ${clientName},

Your training sessions for ${furkidName} have been rescheduled.
${sessionDetails}

If you have any questions or need further changes, please contact our admin team at +65 8222 8376.

_- Hopefordogs Training Team_ 🐕`;
        } else if (booking.booking_status === 'confirmed' && oldBooking?.booking_status === 'pending') {
            message = `✅ *Booking Confirmed*

Hi ${clientName},

Great news! Your booking for *${booking.service_name}* with ${furkidName} has been officially confirmed by our team.

We're all set and looking forward to your first session! If you have any questions before the session, feel free to reach out.

_- Hopefordogs Training Team_ 🐕`;
        } else {
            message = `📝 *Booking Updated*

Hi ${clientName},

Your booking for *${booking.service_name}* with ${furkidName} has been updated.

For details or questions, please contact our team at +65 8222 8376.

_- Hopefordogs Training Team_ 🐕`;
        }
        
        try {
            const conversation = await base44.asServiceRole.agents.createConversation({
                agent_name: 'booking_assistant',
                metadata: {
                    booking_id: booking.id,
                    client_mobile: clientMobile,
                    client_name: clientName,
                    type: 'booking_update'
                }
            });
            
            await base44.asServiceRole.agents.addMessage(conversation, {
                role: 'assistant',
                content: message
            });
            
            return Response.json({ 
                success: true, 
                message: 'Booking update notification sent successfully',
                conversation_id: conversation.id
            });
        } catch (agentError) {
            return Response.json({ 
                success: false,
                message: 'Booking updated but WhatsApp notification could not be sent',
                reason: 'WhatsApp agent not connected',
                booking_id: booking.id
            }, { status: 200 });
        }
        
    } catch (error) {
        console.error('Error sending booking update:', error);
        return Response.json({ 
            success: false,
            message: 'Booking updated but notification system encountered an error',
            error: error.message
        }, { status: 200 });
    }
});