import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const result = await ctx.runAction(internal.actions.stripe.handleWebhook, {
      payload: await request.text(),
      signature: request.headers.get("stripe-signature") ?? "",
    });
    return new Response(null, { status: result.ok ? 200 : 400 });
  }),
});

http.route({
  path: "/stripe/connect-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const result = await ctx.runAction(internal.actions.stripe.handleWebhook, {
      payload: await request.text(),
      signature: request.headers.get("stripe-signature") ?? "",
      secretEnvVar: "STRIPE_CONNECT_WEBHOOK_SECRET",
    });
    return new Response(null, { status: result.ok ? 200 : 400 });
  }),
});

export default http;
