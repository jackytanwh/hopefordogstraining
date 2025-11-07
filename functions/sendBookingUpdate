import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get the booking data from the request
        const { booking, oldBooking, updateType } = await req.json();
        
        if (!booking) {
            return Response.json({ error: 'No booking data provided' }, { status: 400 });
        }
        
        // Check WhatsApp consent
        if (!booking.whatsapp_consent) {
            return Response.json({ message: 'Client did not consent to WhatsApp notifications' }, { status: 200 });
        }
        
        // Extract client information with better fallback handling
        let clientMobile = booking.client_mobile;
        let clientName = booking.client_name || 'Valued Client';
        let furkidName = booking.furkid_name || 'your furkid';
        
        // For FYOG/Group bookings, check the arrays
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
        
        // Validate we have required information
        if (!clientMobile) {
            console.warn('No client mobile number found in booking:', booking.id);
            return Response.json({ 
                message: 'No client mobile number found - skipping WhatsApp notification',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        // Validate mobile number format
        if (!clientMobile.startsWith('+') || clientMobile.length < 8) {
            console.warn('Invalid mobile number format:', clientMobile);
            return Response.json({ 
                message: 'Invalid mobile number format - skipping WhatsApp notification',
                booking_id: booking.id
            }, { status: 200 });
        }
        
        // Check if agents API is available
        if (!base44.asServiceRole || !base44.asServiceRole.agents) {
            console.warn('Agents API not available. WhatsApp agent may not be connected.');
            return Response.json({ 
                message: 'WhatsApp agent not connected. Please connect WhatsApp in Dashboard > Agents.',
                booking_id: booking.id,
                would_send_to: clientMobile
            }, { status: 200 });
        }
        
        let message = '';
        
        // Check if this is a reschedule (session dates changed)
        const isReschedule = oldBooking && 
                            JSON.stringify(oldBooking.session_dates) !== JSON.stringify(booking.session_dates);
        
        if (isReschedule) {
            // Format new session details
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
            // Status changed to confirmed
            message = `✅ *Booking Confirmed*

Hi ${clientName},

Great news! Your booking for *${booking.service_name}* with ${furkidName} has been officially confirmed by our team.

We're all set and looking forward to your first session! If you have any questions before the session, feel free to reach out.

_- Hopefordogs Training Team_ 🐕`;
        } else {
            // Generic update message
            message = `📝 *Booking Updated*

Hi ${clientName},

Your booking for *${booking.service_name}* with ${furkidName} has been updated.

For details or questions, please contact our team at +65 8222 8376.

_- Hopefordogs Training Team_ 🐕`;
        }
        
        // Create a conversation and send the message
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
        
        console.log(`Booking update sent to ${clientMobile} for booking ${booking.id}`);
        
        return Response.json({ 
            success: true, 
            message: 'Booking update notification sent successfully',
            conversation_id: conversation.id
        });
        
    } catch (error) {
        console.error('Error sending booking update:', error);
        console.error('Error details:', error.stack);
        
        // Return a 200 response so the booking update isn't blocked
        return Response.json({ 
            message: 'Booking updated but WhatsApp notification failed',
            error: error.message,
            note: 'Please check WhatsApp agent connection in Dashboard'
        }, { status: 200 });
    }
});