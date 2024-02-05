import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import express from "express";
import json from "body-parser";
import crypto from "crypto";

const prisma = new PrismaClient();
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = new Stripe();
stripe.key = process.env.STRIPE_SECRET_KEY;
// const stripe = require("stripe")(
//
// );

// Find your endpoint's secret in your Dashboard's webhook settings
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Using Express
const app = express();

// Use body-parser to retrieve the raw body as a buffer

const fulfillOrder = (session) => {
  // TODO: fill me in
  const lineItems = session.line_items;
  console.log("Fulfilling order", session);
};

const createOrder = (session) => {
  // TODO: fill me in
  console.log("Creating order", session);
};

function generatePass() {
  let pass = "";
  const str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz0123456789@#$-_&*!%?";
  for (let i = 1; i <= 10; i++) {
    pass += str.charAt(Math.floor(Math.random() * str.length + 1));
  }
  return pass;
}


async function createUser(session) {
  const userName = session.customer;
  console.log("Creating user", userName);
  const email = session.customer_details?.email;
  console.log("Creating user", email);
  const name = session.customer_details?.name;
  console.log("Creating user", name);
  const address = session.customer_details?.address?.line1 || "";
  const line2 = session.customer_details?.address?.line2;
  if (line2) {
    console.log("Creating user", address + " " + line2);
  } else {
    console.log("Creating user", address);
  }
  let uuid = crypto.randomUUID();
  const lic_key = uuid;
  const city = session.customer_details?.address?.city;
  console.log("Creating user", city);
  const state = session.customer_details?.address?.state;
  console.log("Creating user", state);
  const postalCode = session.customer_details?.address?.postal_code;
  console.log("Creating user", postalCode);
  const items = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });
  const sub_id = items.subscription;
  console.log("Creating Subscription", sub_id);
  const sub_prod = items.line_items.data[0].price.product;
  console.log("Creating Product", sub_prod);
  let prod_type = '';
  if (sub_prod === "prod_PTiLGOv1vWNLTE") {
    prod_type = "Pro";
  } else if (sub_prod === "prod_PTHZGmRKREYkk4") {
    prod_type = "Basic";
  } else {
    prod_type = "Free";
  }
  console.log("Creating Product", prod_type);
  const price = items.line_items.data[0].price.id;
  console.log("Creating Price", price);
  let expire_date = new Date();
  switch (price) {
    case "price_1OekvpGuKQxVPasTP3VLQsTe":
      prod_type = "pro-yearly";
      expire_date.setFullYear(expire_date.getFullYear() + 1);
      break;
    case "price_1OekuNGuKQxVPasTpZJ3KLOV":
      prod_type = "pro-monthly";
      expire_date.setMonth(expire_date.getMonth() + 1);
      break;
    case "price_1OektqGuKQxVPasTR1ST3vFq":
      prod_type = "basic-yearly";
      expire_date.setFullYear(expire_date.getFullYear() + 1);
      break;
    case "price_1OeL09GuKQxVPasTvM0wugbM":
      prod_type = "basic-monthly";
      expire_date.setMonth(expire_date.getMonth() + 1);
      break;
    default:
      prod_type = "basic-trial";
  }
  console.log("Expire Date", expire_date.toISOString());

  const keygen_id = process.env(KEYGEN_ID)
  // Make a request to Keygen.sh to generate a license based on customer email
    try {
      const response = await axios.post(
        "https://api.keygen.sh/v1/accounts/your-account-id/licenses",
        {
          metadata: {
            customerEmail: customerEmail,
            // Add other necessary data for license generation
          },
        },
        {
          headers: {
            Authorization: "Bearer your-keygen-api-key",
          },
        }
      );

      return response.data.data.attributes.key;
    } catch (error) {
      console.error("Error generating license:", error.message);
      throw new Error("License Generation Failed");
    }
  }
  const user = await prisma.user.create({
    data: {
      login: name?.replace(" ", "_").toLowerCase() || "user",
      stripe_id: session.customer,
      password: generatePass(),
      first_name: name?.split(" ")[0],
      last_name: name?.split(" ")[1],
      address: address,
      city: city,
      state: state,
      zip: postalCode,
      email: email || "no@email.com",
      active: true,
      confirmed: true,
      licensing: {
        create: {
          cust_id: session.customer,
          active: true,
          confirmed: true,
          license_key: lic_key,
          license_type: prod_type,
          expire_date: expire_date,
        },
      },
      main_settings: {
        create: {
          brand_image: "",
          brand_height: 200,
          brand_width: 200,
          brand_opacity: 1.0,
          form_type: "simple",
          sidebar: "open",
          first_run: true,
        },
      },
      bitly_settings: {
        create: {
          use_value: false,
          label: "Shorten Link",
          aria_label: "Shorten Link with Bitly",
          tooltip: "Shorten Link with Bitly",
          error: "No Bitly Token Found",
          bitly_token: "",
          bitly_domain: "",
          bitly_addr: "https://api-ssl.bitly.com/v4/shorten",
          bitly_enabled: false,
          type: "bitly",
        },
      },
      utm_campaign: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "Campaign",
          tooltip: "Enter a campaign name",
          error: "Please enter a valid campaign name",
          aria_label: "Campaign Name",
          value: [],
        },
      },
      utm_keyword: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "Keywords",
          tooltip: "Additional keywords to append to the link",
          error: "Please enter a valid Keyword",
          aria_label: "Add any additional keywords",
          value: [],
        },
      },
      utm_content: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "Content",
          tooltip: "Additional content to append to the link",
          error: "Please enter a valid content value",
          aria_label: "Add any additional content",
          value: [],
        },
      },
      utm_medium: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "Referral Medium",
          tooltip:
            "What kind of referral link is this? This is usually how you're distributing the link.",
          error: "Please choose a valid referral medium",
          aria_label: "Referral medium",
          value: [
            { key: "cpc", value: "Cost Per Click" },
            { key: "direct", value: "Direct" },
            { key: "display", value: "Display" },
            { key: "email", value: "Email" },
            { key: "event", value: "Event" },
            { key: "organic", value: "Organic" },
            { key: "paid-search", value: "Paid Search" },
            { key: "paid-social", value: "Paid Social" },
            { key: "qr", value: "QR Code" },
            { key: "referral", value: "Referral" },
            { key: "retargeting", value: "Retargeting" },
            { key: "social", value: "Social" },
            { key: "ppc", value: "Pay Per Click" },
            { key: "linq", value: "Linq" },
          ],
        },
      },
      utm_source: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "Referral Source",
          tooltip: "Where will you be posting this link?",
          error: "Please enter a valid referral source",
          aria_label: "Referral Source",
          value: [],
        },
      },
      utm_target: {
        create: {
          use_value: true,
          is_chooser: false,
          show_name: true,
          label: "URL to encode",
          tooltip: "Complete URL to encode",
          error: "Please enter a valid URL",
          aria_label: "This must be a valid URL",
          value: [],
        },
      },
    },
    // send email with username/password and license key
  });

};

const emailCustomerAboutFailedPayment = (session) => {
  // TODO: fill me in
  console.log("Emailing customer", session);
};

app.post(
  "/webhook",
  json.raw({ type: "application/json" }),
  (request, response) => {
    const payload = request.body;
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Session completed, awaiting payment", session);
        // Save an order in your database, marked as 'awaiting payment'
        createOrder(session);

        // Check if the order is paid (for example, from a card payment)
        //
        // A delayed notification payment will have an `unpaid` status, as
        // you're still waiting for funds to be transferred from the customer's
        // account.
        if (session.payment_status === "paid") {
          console.log("Session is already paid, fulfilling order", session);

          createUser(session);
          fulfillOrder(session);
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        console.log("Session async payment succeeded", session);
        // Fulfill the purchase...
        fulfillOrder(session);

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        console.log("Session async payment failed", session);

        // Send an email to the customer asking them to retry their order
        emailCustomerAboutFailedPayment(session);

        break;
      }
    }

    response.status(200).end();
  }
);

app.listen(4242, () => console.log("Running on port 4242"));
