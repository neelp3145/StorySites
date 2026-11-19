import { getSupabaseAdmin, json } from "../lib/supabase.mjs";
import { appOrigin, getStripe } from "../lib/stripe.mjs";

export async function handler(event) {
  const origin = event.headers.origin || event.headers.Origin || "";

  if (event.httpMethod === "OPTIONS") {
    return json(204, {}, origin);
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, message: "Method not allowed." }, origin);
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabaseAdmin();

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { ok: false, message: "Invalid JSON body." }, origin);
    }

    const invoiceId = String(body.invoice_id || body.id || "").trim();
    if (!invoiceId) {
      return json(422, { ok: false, message: "invoice_id is required." }, origin);
    }

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (error || !invoice) {
      return json(404, { ok: false, message: "Invoice not found." }, origin);
    }
    if (String(invoice.status).toLowerCase() === "paid") {
      return json(409, { ok: false, message: "Invoice is already paid." }, origin);
    }
    if (String(invoice.status).toLowerCase() === "cancelled") {
      return json(409, { ok: false, message: "Invoice is cancelled." }, origin);
    }

    const amountCents = Math.round(Number(invoice.amount || 0) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return json(
        422,
        { ok: false, message: "Invoice amount must be at least $0.50." },
        origin
      );
    }

    let customerEmail = String(body.email || "").trim();
    if (!customerEmail && invoice.customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("email")
        .eq("id", invoice.customer_id)
        .maybeSingle();
      customerEmail = customer?.email || "";
    }

    const base = appOrigin(event);
    const portal =
      (process.env.STORYSITES_PORTAL_URL || "https://storysites-mgmt-portal.netlify.app").replace(
        /\/$/,
        ""
      );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `StorySites — ${invoice.customer_name}`,
              description:
                invoice.notes?.slice(0, 400) ||
                `Invoice #${invoice.id} for StorySite services`,
            },
          },
        },
      ],
      success_url: `${base}/pay/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${portal}/?page=invoices&checkout=cancelled`,
      metadata: {
        invoice_id: String(invoice.id),
        customer_name: invoice.customer_name || "",
      },
      payment_intent_data: {
        metadata: {
          invoice_id: String(invoice.id),
        },
      },
    });

    await supabase
      .from("invoices")
      .update({
        status: "sent",
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
        notes: [invoice.notes, `Stripe Checkout created: ${session.id}`]
          .filter(Boolean)
          .join("\n"),
      })
      .eq("id", invoice.id);

    return json(
      200,
      {
        ok: true,
        id: session.id,
        url: session.url,
        invoice_id: String(invoice.id),
      },
      origin
    );
  } catch (error) {
    console.error("create-checkout-session error", error);
    const status = error.statusCode || 500;
    return json(
      status,
      {
        ok: false,
        message:
          status === 503
            ? "Stripe is not configured yet. Set STRIPE_SECRET_KEY."
            : error.message || "Could not create Checkout session.",
      },
      origin
    );
  }
}
