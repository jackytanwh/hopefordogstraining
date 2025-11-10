import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get all active bookings
        const bookings = await base44.asServiceRole.entities.Booking.list();
        const activeBookings = bookings.filter(b => 
            b.booking_status === 'confirmed' && 
            b.whatsapp_consent === true &&
            b.session_dates && 
            b.session_dates.length > 0
        );
        
        const now = new Date();
        const in48Hours = new Date(now.getTime() + (48 * 60 * 60 * 1000));
        
        let remindersSent = 0;
        const results = [];
        
        for (const booking of activeBookings) {
            // Check each session
            for (const session of booking.session_dates) {
                // Skip completed sessions
                if (session.completed) continue;
                
                const sessionDate = new Date(session.date + 'T' + session.start_time);
                
                // Check if session is approximately 48 hours away (within a 2-hour window)
                const timeDiff = sessionDate.getTime() - now.getTime();
                const hoursUntilSession = timeDiff / (1000 * 60 * 60);
                
                // Send reminder if session is between 47 and 49 hours away
                if (hoursUntilSession >= 47 && hoursUntilSession <= 49) {
                    const clientMobile = booking.client_mobile || 
                                       (booking.clients && booking.clients.length > 0 ? booking.clients[0].client_mobile : null);
                    const clientName = booking.client_name || 
                                     (booking.clients && booking.clients.length > 0 ? booking.clients[0].client_name : 'Valued Client');
                    const furkidName = booking.furkid_name || 
                                     (booking.furkids && booking.furkids.length > 0 ? booking.furkids[0].furkid_name : 'your furkid');
                    
                    if (!clientMobile) continue;
                    
                    // Format session details
                    const formattedDate = sessionDate.toLocaleDateString('en-SG', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    });
                    
                    // Preparation tips based on service type
                    let preparationTips = '';
                    if (booking.service_type.includes('kinder_puppy')) {
                        preparationTips = `\n*Preparation Tips:*
• Have your puppy's favorite treats ready
• Ensure they're well-rested before the session
• Have toys and training equipment handy
• Keep the training area clear and distraction-free`;
                    } else if (booking.service_type.includes('basic_manners')) {
                        preparationTips = `\n*Preparation Tips:*
• Have high-value treats ready
• Ensure your dog has had some exercise beforehand
• Have a 6ft leash (non-retractable)
• Keep the training area clear`;
                    } else if (booking.service_type === 'behavioural_modification') {
                        preparationTips = `\n*Preparation Tips:*
• Review notes from previous session
• Prepare any questions you have
• Have treats and training equipment ready
• Ensure a calm environment`;
                    } else if (booking.service_type === 'canine_assessment') {
                        preparationTips = `\n*Preparation Tips:*
• List any behavioral concerns you've noticed
• Note your dog's daily routine
• Have your dog well-exercised but not exhausted
• Prepare any questions you have`;
                    }
                    
                    const message = `⏰ *Session Reminder*

Hi ${clientName}!

This is a friendly reminder that your training session with ${furkidName} is coming up in 48 hours! 

📅 *Session ${session.session_number}*
🗓️ *Date:* ${formattedDate}
🕐 *Time:* ${session.start_time} - ${session.end_time}
🏠 *Service:* ${booking.service_name}
${preparationTips}

We're looking forward to seeing you and ${furkidName}! 🐾

If you need to reschedule, please contact our admin team at +65 8222 8376 as soon as possible.

See you soon!

_- Hopefordogs Training Team_ 🐕`;

                    try {
                        // Create a conversation and send the reminder
                        const conversation = await base44.asServiceRole.agents.createConversation({
                            agent_name: 'booking_assistant',
                            metadata: {
                                booking_id: booking.id,
                                session_number: session.session_number,
                                client_mobile: clientMobile,
                                client_name: clientName,
                                type: 'session_reminder'
                            }
                        });
                        
                        await base44.asServiceRole.agents.addMessage(conversation, {
                            role: 'assistant',
                            content: message
                        });
                        
                        remindersSent++;
                        results.push({
                            booking_id: booking.id,
                            session_number: session.session_number,
                            client_name: clientName,
                            status: 'sent'
                        });
                        
                        console.log(`Reminder sent to ${clientMobile} for booking ${booking.id}, session ${session.session_number}`);
                    } catch (error) {
                        console.error(`Error sending reminder for booking ${booking.id}:`, error);
                        results.push({
                            booking_id: booking.id,
                            session_number: session.session_number,
                            client_name: clientName,
                            status: 'failed',
                            error: error.message
                        });
                    }
                }
            }
        }
        
        return Response.json({ 
            success: true, 
            message: `Session reminders processed. ${remindersSent} reminders sent.`,
            reminders_sent: remindersSent,
            details: results
        });
        
    } catch (error) {
        console.error('Error in session reminders function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});