/**
 * Turn a public contact-form submission into portal records.
 * Always creates an inquiry first (caller), then syncs related tables.
 */

function mapService(serviceType) {
  const s = String(serviceType || "");
  if (/business/i.test(s)) return "Business StorySite";
  if (/creative|author/i.test(s)) return "Creative StorySite";
  if (/personal|professional|executive/i.test(s)) return "Personal StorySite";
  return "Custom StorySite";
}

function parseQuoteAmounts(quoteDisplayed, hostingPreference) {
  const text = String(quoteDisplayed || "");
  const creationMatch = text.match(/\$(\d+(?:\.\d+)?)/);
  const creation = creationMatch ? Number(creationMatch[1]) : null;
  const managed = /StorySites managed hosting/i.test(String(hostingPreference || ""));
  const hosting = managed ? 99 : 0;
  const total =
    creation == null ? (managed ? 99 : null) : creation + hosting;
  return { creation, hosting, total, managed };
}

function daysFromNow(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ inquiryId: number|string, row: Record<string, any> }} input
 */
export async function syncIntakeFromInquiry(supabase, { inquiryId, row }) {
  const full_name = row.full_name;
  const email = row.email;
  const phone = row.phone || null;
  const service_type = mapService(row.service_type);
  const request_type = row.request_type || "";
  const hosting_preference = row.hosting_preference || "Not sure yet";
  const project_details = row.project_details || "";
  const quote = parseQuoteAmounts(row.quote_displayed, hosting_preference);
  const isRequest = /request/i.test(request_type);

  const created = {
    customer_id: null,
    project_id: null,
    invoice_id: null,
    hosting_id: null,
  };

  // --- Customer (upsert by email) ---
  const customerPayload = {
    full_name,
    email,
    phone,
    service_type,
    status: isRequest ? "active" : "prospect",
    notes: [
      `Source: contact form (${request_type})`,
      hosting_preference ? `Hosting preference: ${hosting_preference}` : null,
      project_details ? `Details: ${project_details}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    inquiry_id: Number(inquiryId),
    updated_at: new Date().toISOString(),
  };

  const { data: existingCustomers, error: findErr } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .limit(1);
  if (findErr) throw findErr;

  let customerId;
  if (existingCustomers?.length) {
    customerId = existingCustomers[0].id;
    const { error } = await supabase
      .from("customers")
      .update(customerPayload)
      .eq("id", customerId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("customers")
      .insert(customerPayload)
      .select("id")
      .single();
    if (error) throw error;
    customerId = data.id;
  }
  created.customer_id = customerId;

  // --- Project ---
  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .insert({
      customer_name: full_name,
      service_type,
      status: "not_started",
      due_date: daysFromNow(30),
      notes: [
        `From inquiry #${inquiryId} (${request_type})`,
        project_details,
      ]
        .filter(Boolean)
        .join("\n\n"),
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (projectErr) throw projectErr;
  created.project_id = project.id;

  // --- Invoice (draft estimate from quote) ---
  const amount = quote.total ?? quote.creation ?? 0;
  const { data: invoice, error: invoiceErr } = await supabase
    .from("invoices")
    .insert({
      customer_name: full_name,
      amount,
      status: "draft",
      due_date: daysFromNow(14),
      notes: [
        `Draft estimate from contact form inquiry #${inquiryId}`,
        row.quote_displayed ? `Quote shown: ${row.quote_displayed}` : null,
        quote.managed ? "Includes estimated first-year managed hosting ($99)." : null,
        "Not a paid order until scope is confirmed.",
      ]
        .filter(Boolean)
        .join("\n"),
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (invoiceErr) throw invoiceErr;
  created.invoice_id = invoice.id;

  // --- Hosting ---
  let site_url = "pending-assignment";
  let hostingStatus = "active";
  let hostingNotes = `Hosting preference from inquiry #${inquiryId}: ${hosting_preference}`;
  if (/self-host/i.test(hosting_preference)) {
    site_url = "self-hosted-pending";
    hostingNotes += "\nCustomer prefers HTML / self-hosting delivery.";
  } else if (/managed/i.test(hosting_preference)) {
    site_url = "managed-hosting-pending";
    hostingNotes += "\nCustomer requested StorySites managed hosting ($99/yr estimate).";
  } else {
    hostingNotes += "\nHosting preference not decided yet.";
  }

  const { data: hosting, error: hostingErr } = await supabase
    .from("hosting")
    .insert({
      customer_name: full_name,
      site_url,
      renewal_date: daysFromNow(365),
      status: hostingStatus,
      notes: hostingNotes,
      customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (hostingErr) throw hostingErr;
  created.hosting_id = hosting.id;

  return created;
}
