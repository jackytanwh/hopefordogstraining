import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function extractClientInfo(booking: any) {
    let clientMobile = booking.client_mobile || '';
    let clientName = booking.client_name || '';
    let furkidName = booking.furkid_name || '';

    const allEmails: string[] = [];
    if (booking.client_email) allEmails.push(booking.client_email);

    if (booking.clients && booking.clients.length > 0) {
        for (const c of booking.clients) {
            if (!c) continue;
            if (!clientMobile) clientMobile = c.client_mobile || c.clientMobile || '';
            if (!clientName) clientName = c.client_name || c.clientName || '';
            const email = c.client_email || c.clientEmail || '';
            if (email && !allEmails.includes(email)) allEmails.push(email);
        }
    }

    if (!furkidName && booking.furkids && booking.furkids.length > 0) {
        const f = booking.furkids.find((fk: any) => fk?.furkid_name);
        if (f) furkidName = f.furkid_name;
    }

    return {
        clientMobile,
        clientName: clientName || 'Valued Client',
        clientEmail: allEmails[0] || '',
        allClientEmails: allEmails,
        furkidName: furkidName || 'your furkid',
    };
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function getDayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-SG', { weekday: 'long' });
}

interface ProgramConfig {
    greeting: string;
    instructions: string[];
    pdfLink: string;
    pdfLabel: string;
    promoBlock: boolean;
    addressLabel: string;
    discountCode: string;
}

function getProgramConfig(serviceType: string): ProgramConfig {
    const pawsBotanicPromo = true;

    if (serviceType.includes('kinder_puppy')) {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [],
            pdfLink: 'https://canva.link/kpp-essential-handouts',
            pdfLabel: 'IMPORTANT! Access the KPP Essential Handouts here',
            promoBlock: pawsBotanicPromo,
            addressLabel: 'Address',
            discountCode: '',
            pawgressCode: true,
        };
    }

    if (serviceType === 'basic_manners_in_home') {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [
                'You will also need a regular collar/harness and leash (<strong>NO retractable leash</strong>) and lots of bite-sized treats.',
            ],
            pdfLink: 'https://canva.link/basic-manners-program-6weeks',
            pdfLabel: 'IMPORTANT! Access the Basic Manners 6-Weeks Handouts here',
            promoBlock: pawsBotanicPromo,
            addressLabel: 'Address',
            discountCode: '',
        };
    }

    if (serviceType === 'basic_manners_fyog') {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [
                'You will also need a regular collar/harness and leash (<strong>NO retractable leash</strong>) and lots of bite-sized treats.',
                'Water for <strong>[furkid_name]</strong>',
            ],
            pdfLink: 'https://canva.link/basic-manners-program-6weeks',
            pdfLabel: 'IMPORTANT! Basic Manners 6-Weeks Handouts',
            promoBlock: pawsBotanicPromo,
            addressLabel: 'Location',
            discountCode: '',
        };
    }

    if (serviceType === 'basic_manners_group_class') {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [
                'You will also need a regular collar/harness and leash (<strong>NO retractable leash or slip leash</strong>) and lots of bite-sized treats.',
                'Water for <strong>[furkid_name]</strong>',
            ],
            pdfLink: 'https://www.hopefordogs.sg/wp-content/uploads/2025/07/Basic-Manners-7-weeks-Handouts-2025.pdf',
            pdfLabel: 'IMPORTANT! Access the Basic Manners 7-Weeks Handouts 2025',
            promoBlock: pawsBotanicPromo,
            addressLabel: 'Address',
            discountCode: '',
        };
    }

    if (serviceType === 'behavioural_modification') {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [],
            pdfLink: 'https://canva.link/behavioural-modification-handouts',
            pdfLabel: 'IMPORTANT! Access the First Steps To Helping A Reactive Dog here',
            promoBlock: false,
            addressLabel: 'Address',
            discountCode: '',
        };
    }

    if (serviceType === 'canine_assessment') {
        return {
            greeting: 'Thank you for choosing Hopefordogs Canine Training as your training partner!',
            instructions: [],
            pdfLink: '',
            pdfLabel: '',
            promoBlock: false,
            addressLabel: 'Address',
            discountCode: 'DISCOUNT10',
        };
    }

    return {
        greeting: 'Thank you for choosing Hopefordogs Canine Training. ',
        instructions: [],
        pdfLink: '',
        pdfLabel: '',
        promoBlock: false,
        addressLabel: 'Address',
        discountCode: '',
    };
}

function buildConfirmationEmailHtml(booking: any, clientName: string, furkidName: string): string {
    const serviceType = booking.service_type || '';
    const serviceName = booking.service_name || 'Training Service';
    const config = getProgramConfig(serviceType);
    const totalPrice = Number(booking.total_price || 0).toFixed(2);

    const isGroupClass = serviceType === 'basic_manners_group_class';
    const address = isGroupClass
        ? '73 Redhill Road MSCP, Level 7'
        : (booking.client_address || booking.clients?.[0]?.client_address || booking.clients?.[0]?.clientAddress || '');
    const postalCode = booking.client_postal_code || booking.clients?.[0]?.client_postal_code || '';

    const firstSession = booking.session_dates?.[0];
    const firstDate = firstSession ? formatDate(firstSession.date) : '';
    const firstTime = firstSession?.start_time || '';
    const firstDay = firstSession ? getDayOfWeek(firstSession.date) : '';

    const isCanineAssessment = serviceType === 'canine_assessment';

    // Build recurring schedule (skip for canine assessment — single session only)
    let scheduleHtml = '';
    if (!isCanineAssessment && booking.session_dates && booking.session_dates.length > 0) {
        const rows = booking.session_dates.map((s: any) => `
            <tr>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 14px;">Session ${s.session_number}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; font-weight: 500;">${formatDateShort(s.date)}</td>
                <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px;">${s.start_time}${s.end_time ? ' – ' + s.end_time : ''}</td>
            </tr>`).join('');

        scheduleHtml = `
        <div style="margin: 20px 0;">
            <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">Recurring schedule:</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Session</th>
                        <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Date</th>
                        <th style="padding: 10px 14px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0;">Time</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    // Build instructions
    const processedInstructions = config.instructions.map(i =>
        i.replace('[furkid_name]', furkidName)
    );
    let instructionsHtml = '';
    if (processedInstructions.length > 0) {
        instructionsHtml = processedInstructions.map(i => `<p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 8px 0;">${i}</p>`).join('');
    }

    // Paws Botanic promo block
    let promoHtml = '';
    if (config.promoBlock) {
        promoHtml = `
        <div style="background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
                🛍️ Shop for <a href="https://www.pawsbotanic.co/" style="color: #b45309; font-weight: 600;">Paws Botanic Pet Grooming Essentials</a><br/>
                Promo Code: <strong>20OFFNEW</strong>
            </p>
        </div>`;
    }

    // Pets' Delight birthday promo (all programs)
    const petsDelightHtml = `
    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="font-size: 14px; color: #7c2d12; margin: 0 0 6px 0;">🎂 Celebrating <strong>${furkidName}</strong>'s birthday? Enjoy <strong>10% off all cake orders</strong> at <a href="https://petsdelight.sg/" style="color: #c2410c; font-weight: 600;">Pets' Delight</a> — no minimum spend required!</p>
        <p style="font-size: 14px; color: #7c2d12; margin: 0 0 4px 0;">Simply use the exclusive promo code: <strong>HOPEFORDOGS10</strong></p>
    </div>`;

    // PAWGRESS10 discount code block (Kinder Puppy only)
    let pawgressHtml = '';
    if (config.pawgressCode) {
        pawgressHtml = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #166534; margin: 0 0 6px 0;">🎓 Ready to take the next step? When <strong>${furkidName}</strong> completes the Kinder Puppy Program, continue the journey with our <strong>Basic Manners Program</strong>!</p>
            <p style="font-size: 14px; color: #166534; margin: 0 0 4px 0;">Use the exclusive discount code below — valid for <strong>12 months</strong> from today: <strong>PAWGRESS10</strong></p>
        </div>`;
    }

    // PDF attachment link
    let pdfHtml = '';
    if (config.pdfLink) {
        pdfHtml = `
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #0c4a6e; margin: 0;">
                📎 <a href="${config.pdfLink}" style="color: #0369a1; font-weight: 600; text-decoration: underline;">${config.pdfLabel}</a>
            </p>
        </div>`;
    }

    // Discount code block (canine assessment)
    let discountHtml = '';
    if (config.discountCode) {
        discountHtml = `
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="font-size: 14px; color: #166534; margin: 0 0 4px 0;">10% discount for any future program: <strong>${config.discountCode}</strong></p>
        </div>`;
    }

    // Terms & Agreements block
    let agreementsHtml = '';
    const agreementItems: string[] = [];

    if (serviceType.includes('kinder_puppy')) {
        if (booking.agreement_kinder_puppy_curriculum) agreementItems.push('I have read and understood the Kinder Puppy Program curriculum and training approach.');
        if (booking.agreement_kinder_puppy_potty_training) agreementItems.push('I understand and commit to the potty training requirements outlined in the program.');
        if (booking.agreement_kinder_puppy_refund_policy) agreementItems.push('I acknowledge that there are no refunds, exchanges, or cancellations once enrolled.');
    } else if (serviceType === 'basic_manners_in_home' || serviceType === 'basic_manners_fyog' || serviceType === 'basic_manners_group_class') {
        if (booking.agreement_no_retractable_leash) agreementItems.push('I agree not to use retractable or slip leashes during training sessions.');
        if (booking.agreement_no_refunds) agreementItems.push('I acknowledge that there are no refunds, exchanges, or cancellations once enrolled.');
        if (booking.agreement_dog_behavior) agreementItems.push('I confirm that my dog is not fearful, anxious, or reactive.');
    } else if (serviceType === 'behavioural_modification') {
        if (booking.agreement_behavioral_modification_understanding) {
            agreementItems.push('I confirm that I have read the FAQs and fully understand that there are NO quick fixes in behaviour modification, and it is influenced by multiple factors, including diet, sterilisation status, the environment, medical conditions, etc.');
            agreementItems.push('I acknowledge that behaviour change is gradual and takes time. The training progress and outcomes depend on my commitment to following the training plan provided by the canine behaviour consultant.');
            agreementItems.push('I will provide regular updates on the training progress, accompanied by video recordings, every few days.');
            agreementItems.push('I acknowledge that Hopefordogs Canine Training does NOT offer refunds, exchanges, or cancellations, regardless of the training outcome.');
        }
    }

    if (agreementItems.length > 0) {
        const items = agreementItems.map(a => `<li style="font-size: 15px; color: #475569; margin-bottom: 6px;">✓ ${a}</li>`).join('');
        agreementsHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 15px; font-weight: 600; color: #1e293b; margin: 0 0 10px 0;">Terms & Agreements Acknowledged</p>
            <ul style="margin: 0; padding-left: 4px; list-style: none;">${items}</ul>
        </div>`;
    }

    // Pricing breakdown
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

    // Products ordered
    let productsRowsHtml = '';
    if (booking.product_selections && booking.product_selections.length > 0) {
        const productLines = booking.product_selections.map((p: any) =>
            `<tr><td style="padding: 4px 0; color: #475569; font-size: 13px; padding-left: 12px;">• ${p.product_name} × ${p.quantity}</td><td style="padding: 4px 0; text-align: right; color: #475569; font-size: 13px;">$${Number(p.discounted_price * p.quantity).toFixed(2)}</td></tr>`
        ).join('');
        productsRowsHtml = `
            <tr><td colspan="2" style="padding: 8px 0 2px 0; font-size: 13px; font-weight: 600; color: #1e293b; border-top: 1px solid #e2e8f0;">Products Ordered</td></tr>
            ${productLines}
            <tr><td style="padding: 4px 0 8px 0; color: #64748b; font-size: 13px; padding-left: 12px;">Products Subtotal</td><td style="padding: 4px 0 8px 0; text-align: right; color: #64748b; font-size: 13px;">$${Number(booking.products_total || 0).toFixed(2)}</td></tr>
        `;
    }

    const pawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 18c-3.5 0-6-2.5-6-5 0-1.7 1-3.2 2.5-4C10 8.3 11 8 12 8s2 .3 3.5 1c1.5.8 2.5 2.3 2.5 4 0 2.5-2.5 5-6 5z"/></svg>`;

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <img src="https://media.base44.com/images/public/690f36a014bb3e1119479c64/981c2d0c1_DogLogonewSmallCustom.png" alt="Hopefordogs" style="height: 60px; width: auto; object-fit: contain; margin-bottom: 16px;" />
            <h1 style="margin: 0 0 8px 0; font-size: 26px; color: white; font-weight: 700;">Booking Confirmed!</h1>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 15px;">${serviceName}</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${clientName}</strong> and <strong>${furkidName}</strong>,</p>

            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 8px 0;">
                ${config.greeting} You have enrolled for <strong>${serviceName}</strong>
                ${firstDate ? ` starting <strong>${firstDate}</strong>, ${firstTime}${firstDay ? ', ' + firstDay : ''}.` : '.'}
            </p>

            <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
                At Hopefordogs Canine Training, we are committed to using compassionate, reward-based methods, with the dog’s welfare and emotional wellbeing at the core of our approach. We do not support or permit the use of aversive tools such as choke chains, head halters, or electronic collars under any circumstances. We reserve the right to terminate services should these methods be used.
            </p>

            ${address ? `<p style="font-size: 14px; color: #334155; margin: 0 0 4px 0;"><strong>${config.addressLabel}:</strong> ${address}${postalCode ? ', ' + postalCode : ''}</p>` : ''}

            ${scheduleHtml}

            ${pdfHtml}

            ${instructionsHtml}

            ${promoHtml}

            ${pawgressHtml}

            ${petsDelightHtml}

            ${discountHtml}

            <!-- Pricing -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    ${pricingRows}
                    ${productsRowsHtml}
                    <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="padding: 10px 0 4px 0; font-size: 15px; color: #475569; font-weight: 600;">Total Paid</td>
                        <td style="padding: 10px 0 4px 0; text-align: right; font-size: 15px; color: #16a34a; font-weight: 700;">$${totalPrice}</td>
                    </tr>
                </table>
            </div>

            ${agreementsHtml}

            <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 16px 0 0 0;">Feel free to reach out if you have any questions.</p>

            <p style="font-size: 15px; color: #1e293b; margin: 20px 0 0 0;">
                Kind regards,<br/>
                <strong>Jacky, ISCP Canine Dip. Prac.</strong><br/>
                Hopefordogs Canine Training
            </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px; text-align: center; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: #f8fafc;">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #334155;">Hopefordogs Canine Training</p>
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">Educate | Advocate | Empower</p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #94a3b8;">
                <a href="https://bookings.hopefordogs.sg" style="color: #2563eb; text-decoration: none;">bookings.hopefordogs.sg</a>
                &nbsp;&middot;&nbsp; WhatsApp: +65 8222 8376
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

        const { clientMobile, clientName, clientEmail, allClientEmails, furkidName } = extractClientInfo(booking);
        const results: { whatsapp: string; email: string; email_recipients?: string[] } = { whatsapp: 'skipped', email: 'skipped' };

        // --- WhatsApp ---
        if (booking.whatsapp_consent && clientMobile && clientMobile.startsWith('+') && clientMobile.length >= 8) {
            const serviceType = booking.service_type || '';
            const config = getProgramConfig(serviceType);
            const firstSession = booking.session_dates?.[0];
            const firstDate = firstSession ? formatDate(firstSession.date) : '';
            const firstTime = firstSession?.start_time || '';
            const firstDay = firstSession ? getDayOfWeek(firstSession.date) : '';
            const isGroupClass = serviceType === 'basic_manners_group_class';
            const address = isGroupClass ? '73 Redhill Road MSCP, Level 7' : (booking.client_address || '');

            let scheduleWa = '';
            if (serviceType !== 'canine_assessment' && booking.session_dates && booking.session_dates.length > 1) {
                scheduleWa = '\n\n*Recurring schedule:*';
                for (const s of booking.session_dates) {
                    scheduleWa += `\nSession ${s.session_number}: ${formatDateShort(s.date)} at ${s.start_time}`;
                }
            }

            let instructionsWa = '';
            if (serviceType === 'basic_manners_in_home' || serviceType === 'basic_manners_fyog' || serviceType === 'basic_manners_group_class') {
                instructionsWa += '\n\nYou will also need a regular collar/harness and leash (NO retractable leash/slip leash) and lots of bite-sized treats.';
            }
            if (serviceType === 'basic_manners_fyog' || serviceType === 'basic_manners_group_class') {
                instructionsWa += `\nWater for ${furkidName}`;
            }
            if (serviceType === 'canine_assessment') {
                instructionsWa += "\n\nHere's the 10% discount code if you decide to enrol for any program later: *DISCOUNT10*";
            }

            const promoWa = config.promoBlock ? '\n\nShop for Paws Botanic Pet Grooming Essentials (Promo Code: 20OFFNEW)\nhttps://www.pawsbotanic.co/' : '';
        const pawgressWa = config.pawgressCode ? `\n\n🎓 When ${furkidName} completes the Kinder Puppy Program, continue with our Basic Manners Program! Use code *PAWGRESS10* (valid 6 months) for an exclusive discount.` : '';
            const petsDelightWa = `\n\n🎂 Celebrating ${furkidName}'s birthday? Enjoy 10% off all cake orders at Pets' Delight (https://petsdelight.sg/) — no minimum spend required!\nSimply use the exclusive promo code: *HOPEFORDOGS10*`;

            const message = `Hello ${clientName} and ${furkidName},\n\n${config.greeting} You have enrolled for *${booking.service_name}*${firstDate ? ` starting ${firstDate}, ${firstTime}, ${firstDay}` : ''}.${address ? `\n${config.addressLabel}: ${address}` : ''}${scheduleWa}${instructionsWa}${promoWa}${pawgressWa}${petsDelightWa}\n\nFeel free to reach out if you have any questions.\n\nKind regards,\nJacky\nHopefordogs`;

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

        if (RESEND_API_KEY && allClientEmails.length > 0) {
            try {
                const { Resend } = await import('npm:resend');
                const resend = new Resend(RESEND_API_KEY);
                const fromAddress = RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const emailSubject = `Booking Confirmed: ${booking.service_name || 'Training Service'}`;
                const sentTo: string[] = [];

                const hasMultipleClients = booking.clients && booking.clients.length > 1;

                if (hasMultipleClients) {
                    // Send personalized email per client-dog pair
                    for (let i = 0; i < booking.clients.length; i++) {
                        const c = booking.clients[i];
                        if (!c) continue;
                        const cEmail = c.client_email || c.clientEmail || '';
                        if (!cEmail) continue;

                        const cName = c.client_name || c.clientName || 'Valued Client';
                        const pairedFurkid = booking.furkids?.[i];
                        const cFurkidName = pairedFurkid?.furkid_name || furkidName;

                        try {
                            await resend.emails.send({
                                from: fromAddress,
                                to: [cEmail],
                                subject: emailSubject,
                                html: buildConfirmationEmailHtml(booking, cName, cFurkidName),
                            });
                            sentTo.push(cEmail);
                            console.log(`✅ Personalized email sent to ${cEmail} (${cName} & ${cFurkidName})`);
                        } catch (singleErr) {
                            console.error(`⚠️ Email to ${cEmail} failed:`, singleErr);
                        }
                    }
                } else {
                    // Single client — send one email
                    const recipientEmail = allClientEmails[0];
                    try {
                        await resend.emails.send({
                            from: fromAddress,
                            to: [recipientEmail],
                            subject: emailSubject,
                            html: buildConfirmationEmailHtml(booking, clientName, furkidName),
                        });
                        sentTo.push(recipientEmail);
                        console.log(`✅ Confirmation email sent to ${recipientEmail}`);
                    } catch (singleErr) {
                        console.error(`⚠️ Email to ${recipientEmail} failed:`, singleErr);
                    }
                }

                // --- Admin notification to jacky@hopefordogs.sg ---
                try {
                    const firstSession = booking.session_dates?.[0];
                    const startDate = firstSession ? formatDate(firstSession.date) : 'TBD';
                    const startDay = firstSession ? getDayOfWeek(firstSession.date) : '';
                    const startTime = firstSession?.start_time || '';
                    const serviceType = booking.service_type || '';
                    const isGroupClass = serviceType === 'basic_manners_group_class';
                    const location = isGroupClass
                        ? '73 Redhill Road MSCP, Level 7'
                        : (booking.client_address
                            ? `${booking.client_address}${booking.client_postal_code ? ', ' + booking.client_postal_code : ''}`
                            : (booking.clients?.[0]?.client_address || booking.clients?.[0]?.clientAddress || 'N/A'));

                    const adminClientName = clientName;
                    const adminFurkidName = furkidName;
                    const adminMobile = clientMobile || 'N/A';
                    const totalPrice = Number(booking.total_price || 0).toFixed(2);
                    const serviceName = booking.service_name || 'Training Service';

                    const adminSubject = `${adminClientName} & ${adminFurkidName}, enrolled ${serviceName} - $${totalPrice}`;

                    let productsHtml = '';
                    if (booking.product_selections && booking.product_selections.length > 0) {
                        const productLines = booking.product_selections.map((p: any) =>
                            `<li>${p.product_name} × ${p.quantity} — $${Number(p.discounted_price * p.quantity).toFixed(2)}</li>`
                        ).join('');
                        productsHtml = `<p><strong>Products ordered:</strong></p><ul>${productLines}</ul>`;
                    } else {
                        productsHtml = `<p><strong>Products ordered:</strong> None</p>`;
                    }

                    let adminScheduleHtml = '';
                    if (booking.session_dates && booking.session_dates.length > 0) {
                        const sessionRows = booking.session_dates.map((s: any) =>
                            `<tr><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">Session ${s.session_number}</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; font-weight: 500;">${formatDateShort(s.date)}</td><td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #1e293b;">${s.start_time}${s.end_time ? ' – ' + s.end_time : ''}</td></tr>`
                        ).join('');
                        adminScheduleHtml = `
                        <p><strong>Scheduled Sessions:</strong></p>
                        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 12px;">
                            <thead><tr style="background: #f8fafc;"><th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0;">Session</th><th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0;">Date</th><th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #64748b; border-bottom: 2px solid #e2e8f0;">Time</th></tr></thead>
                            <tbody>${sessionRows}</tbody>
                        </table>`;
                    }

                    const adminHtml = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">New Booking</h2>
                        <p>${adminClientName} <strong>${adminMobile}</strong> has enrolled for <strong>${serviceName}</strong> starting ${startDate}, ${startDay}, ${startTime} at ${location}</p>
                        ${adminScheduleHtml}
                        ${productsHtml}
                        <p style="color: #64748b; font-size: 13px;">Total: <strong>$${totalPrice}</strong></p>
                    </div>`;

                    await resend.emails.send({
                        from: fromAddress,
                        to: ['jacky@hopefordogs.sg'],
                        subject: adminSubject,
                        html: adminHtml,
                    });
                    console.log('✅ Admin notification email sent to jacky@hopefordogs.sg');
                } catch (adminEmailErr) {
                    console.error('⚠️ Admin notification email failed:', adminEmailErr);
                }

                results.email = sentTo.length > 0 ? 'sent' : 'failed';
                results.email_recipients = sentTo;
                console.log(`✅ Confirmation emails sent to ${sentTo.length} recipient(s)`);
            } catch (emailError) {
                results.email = 'failed';
            }
        }

        return Response.json({ success: true, booking_id: booking.id, notifications: results });

    } catch (error) {
        console.error('❌ sendBookingConfirmation error:', error);
        return Response.json({ success: false, error: error.message, note: 'Booking was still created successfully' }, { status: 200 });
    }
});