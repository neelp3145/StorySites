import { getSupabaseAdmin } from "../lib/supabase.mjs";
import { getStripe } from "../lib/stripe.mjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return { statusCode: 503, body: "Webhook not configured" };
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch (error) {
    console.error(error.message);
    return { statusCode: 503, body: "Stripe not configured" };
  }

  const signature =
    event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  if (!signature) {
    return { statusCode: 400, body: "Missing stripe-signature" };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    if (
      stripeEvent.type === "checkout.session.completed" ||
      stripeEvent.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = stripeEvent.data.object;
      const invoiceId = session.metadata?.invoice_id;
      if (!invoiceId) {
        console.warn("Checkout session missing invoice_id metadata", session.id);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
      }

      const supabase = getSupabaseAdmin();
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, notes, status")
        .eq("id", invoiceId)
        .maybeSingle();

      if (!invoice) {
        console.warn("Invoice not found for Stripe session", invoiceId);
      } else if (String(invoice.status).toLowerCase() !== "paid") {
        const { error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            stripe_session_id: session.id,
            stripe_payment_intent: paymentIntent,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: [invoice.notes, `Paid via Stripe Checkout (${session.id})`]
              .filter(Boolean)
              .join("\n"),
          })
          .eq("id", invoiceId);
        if (error) {
          console.error("Failed to mark invoice paid", error);
          return { statusCode: 500, body: "DB update failed" };
        }
      }
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("stripe-webhook handler error", error);
    return { statusCode: 500, body: "Webhook handler failed" };
  }
}
