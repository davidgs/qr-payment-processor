import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import express from "express";
import json from "body-parser";
import crypto from "crypto";
import axios from "axios";
import cors from "cors";
import { updateBitlySettings, updateMainSettings, updateQRSettings, updateUTMSettings, updateUserSettings, lookupUser, lookupUserByEmail, addUserToDatabase } from "./database.js";
import { createUserfrontUser, findUserfrontUser } from "./userfrontActions.js";
import { getMachine } from "./keygenActions.js";
import { emailAccountDetails } from "./mailer.js";

const prisma = new PrismaClient();
// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys

// stripe.Authorization = process.env.STRIPE_SECRET_KEY;
// const stripe = require("stripe")(
//
// );

// Find your endpoint's secret in your Dashboard's webhook settings
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const KEYGEN_ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID;
const stripe_secret = process.env.STRIPE_SECRET_KEY;
const KEYGEN_PRODUCT_TOKEN = process.env.KEYGEN_PRODUCT_TOKEN;

if (
  !STRIPE_KEY ||
  !endpointSecret ||
  !KEYGEN_ACCOUNT_ID ||
  !stripe_secret ||
  !KEYGEN_PRODUCT_TOKEN
) {
  process.exit(1);
}
const stripe = new Stripe(STRIPE_KEY);
stripe.key = process.env.STRIPE_KEY;
// Using Express
const app = express();
app.use(cors());
// app.use(express.json(
//   {
//     limit: "10mb"
//   }));
app.use(json.raw({ type: "*/*" }, { limit: "10mb" }));
// Use body-parser to retrieve the raw body as a buffer

/**
 * Fulfill the order once it's paid.
 * @param {*} session
 */
async function fulfillOrder(session) {
  console.log("Fulfilling order", session);
  // get the line items from the session
  const sess = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items"],
  });
  // get the subscription from the session
  const subs = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["subscription"],
  });
  // get the product id from the subscription
  const prodID = subs.subscription.items.data[0].price.id;
  console.log("Product ID: ", prodID);
  // get the tag from the subscription
  const tag = subs.subscription.items.data[0].price.lookup_key;
  console.log("Tag: ", tag);
  console.log("Subscriptions ", subs);
  const lineItems = sess.line_items;
  console.log("Line Items: ", lineItems);
  // get the type of product
  const type = lineItems.data[0].description;
  // get the product id
  const product = lineItems.data[0].price.product;
  console.log("Type", type);
  const sub_stat = subs.subscription.status;
  console.log("Subscription Status", sub_stat);
  let lic;
  // check the product id and create a license based on the product
  switch (product) {
    case "prod_PTHZGmRKREYkk4": // qrcode basic
      console.log(`Fulfilling order for ${type} ProductID: ${product}`);
      lic = await createLicense(session, tag);
      console.log("License: ", lic);
      break;
    case "prod_PTiLGOv1vWNLTE": // qrcode pro
      console.log(`Fulfilling order ${type} ProductID: ${product}`);
      lic = await createLicense(session, tag);
      break;
    case "prod_PVW8bgwnAdrsw2": // qrcode enterprise
      console.log(`Fulfilling order for ${type} ProductID: ${product}`);
      lic = await createLicense(session, tag);
      break;
    default:
      console.log("Product not found");
  }
  // if a license was created, update the user with the license key
  if (lic) {
    console.log("License Generated", lic);
    const username = `${session.customer_details.name
      .toLowerCase()
      .replace(" ", "_")}`;
    const user = await lookupUserByEmail({
      username: username,
      email: session.customer_details.email,
    });
    // User is in the local database
    if (user) {
      console.log("User Found", user);
      // Update user with license key
      const updatedUser = await prisma.user.update({
        where: {
          login: username,
        },
        data: {
          keygen_id: lic.data.relationships.account.data.id,
          stripe_id: session.customer,
          first_name: session.customer_details.name.split(" ")[0],
          last_name: session.customer_details.name.split(" ")[1],
          organization: "",
          address: session.customer_details.address?.line_1 || "",
          city: session.customer_details.address?.city || "",
          state: session.customer_details.address?.state || "",
          zip: session.customer_details.address?.postal_code || "",
          licensing: {
            upsert: {
              create: {
                cust_id: lic.data.relationships.account.data.id,
                active: false,
                confirmed: true,
                license_key: lic.data.attributes.key,
                license_type: tag,
                license_status: sub_stat,
                expire_date: lic.data.attributes.expiry,
              },
              update: {
                cust_id: lic.data.relationships.account.data.id,
                active: true,
                confirmed: true,
                license_key: lic.data.attributes.key,
                license_type: tag,
                license_status: sub_stat,
                expire_date: lic.data.attributes.expiry,
              },
            },
            update: {
              cust_id: lic.data.relationships.account.data.id,
              active: true,
              confirmed: true,
              license_key: lic.data.attributes.key,
              license_type: tag,
              license_status: sub_stat,
              expire_date: lic.data.attributes.expiry,
            },
          },
        },
      });
      // Send email to customer with license key
      // Send email to customer with login details
    } else {
      // User is not in the local database
      // see if they are in userfront
      const uf = await findUserfrontUser({
        username: username,
        email: session.customer_details.email,
      });
      if (uf.totalCount === 0) {
        console.log("Userfront User not Found", uf);
        const f = await createUserfrontUser({
          username: username,
          email: session.customer_details.email,
          name: session.customer_details.name,
          address: session.customer_details.address?.line1 || "",
          city: session.customer_details.address?.city || "",
          state: session.customer_details.address?.state || "",
          postalCode: session.customer_details.address?.postal_code || "",
        });
        console.log("Userfront User Created", f);
      }
        // Create user in database
      const newUser = await addUserToDatabase(session);
        // console.log("User Not Found");
    }
  }
}

const createOrder = (session) => {
  // TODO: fill me in
  console.log("Creating order", session);
};



/**
 * Create a license from keygen.sh
 * @param {*} session
 * @returns
 */
async function createLicense(session, prod_type) {
  let lic_type = "";
  let policy_id = "";
  switch (prod_type) {
    case "pro-yearly":
      lic_type = "866e42de-f99e-482d-8804-94bdfa864627";
      policy_id = "f3be5024-89e2-49b2-9a4d-bdfe7dfb4dc4";
      break;
    case "pro-monthly":
      lic_type = "8d0c09f5-d533-4b90-8c6e-e6387e08fa71";
      policy_id = "f4acfd92-4b41-4231-bc20-a054bc46df18";
      break;
    case "basic-yearly":
      lic_type = "9185ef4d-8004-4f76-aac5-1efbfe3fadff";
      policy_id = "b6653db9-f5de-43f7-b5bf-3e9a5e59dd56";
      break;
    case "basic-monthly":
      lic_type = "408762d1-c143-48a2-a10e-88d19677338e";
      policy_id = "940c4ced-8cfb-481e-811e-80318c782d03";
      break;
    case "enterprise-monthly":
      lic_type = "prod_5";
      policy_id = "3bae2503-078b-4e3f-a0ef-8d145074d65e";
      break;
    case "enterprise-yearly":
      lic_type = "prod_6";
      policy_id = "5744fcdf-8b87-4cbf-89a5-47d313ba7bff";
      break;
    default:
      lic_type = "prod_7";
  }
  try {
    const response = await axios.post(
      `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses`,
      {
        data: {
          type: "licenses",
          attributes: {
            metadata: {
              customerEmail: session.customer_details.email,
              // Add other necessary data for license generation
            },
          },
          relationships: {
            policy: {
              data: { type: "policies", id: policy_id },
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
          ContentType: "application/vnd.api+json",
          Accept: "application/vnd.api+json",
        },
      }
    );
    console.log("License Generated", response.data.data.attributes.key);
    return response.data;
  } catch (error) {
    console.error("Error generating license:", error.message);
    throw new Error("License Generation Failed");
  }
}

const emailCustomerAboutFailedPayment = (session) => {
  // TODO: fill me in
  console.log("Emailing customer", session);
};

/**
 * Email the customer with their login details
 */
const emailCustomerLoginDetails = (session) => {
  // TODO: fill me in
  console.log("Emailing customer", session);
};

/**
 * Create a user in the database
 * @param {*} session
 * @returns
 * @throws
 **/
async function gatherCustomerData(session) {
  const email = session.customer_details?.email;
  console.log("Creating user", email);
  const realName = session.customer_details?.name;
  const login = realName?.replace(" ", "_").toLowerCase();
  console.log(`Creating user username: ${login}`);
  console.log("Creating user", realName);
  const address = session.customer_details?.address?.line1 || "";
  const line2 = session.customer_details?.address?.line2;
  if (line2) {
    console.log("Creating user", address + " " + line2);
  } else {
    console.log("Creating user", address);
  }
  let uuid = crypto.randomUUID();
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
  const price = items.line_items.data[0].price.id;
  console.log("Creating Price", price);
  let expire_date = new Date();
  let prod_type = "";
  switch (price) {
    case "price_1OekvpGuKQxVPasTP3VLQsTe":
      prod_type = "pro-yearly";
      break;
    case "price_1OekuNGuKQxVPasTpZJ3KLOV":
      prod_type = "pro-monthly";
      break;
    case "price_1OektqGuKQxVPasTR1ST3vFq":
      prod_type = "basic-yearly";
      break;
    case "price_1OeL09GuKQxVPasTvM0wugbM":
      prod_type = "basic-monthly";
      break;
    case "price_1OgV5rGuKQxVPasT044gOB4u":
      prod_type = "enterprise-monthly";
      break;
    case "price_1OgV6OGuKQxVPasTNpLMEMFS":
      prod_type = "enterprise-yearly";
      break;
    default:
      prod_type = "free";
  }

  // Make a request to Keygen.sh to generate a license based on customer email
  const response = await createLicense(session, prod_type);

  console.log(`Response: ${response}`);
  const see_obj = {
    username: login,
    customer: userName,
    customer_details: {
      email: email,
      name: realName,
      address: {
        line_1: address,
        line_2: line2,
        city: city,
        state: state,
        postal_code: postalCode,
      },
    },
    lic_key: response,
    prod_type: prod_type,
    expire_date: expire_date,
  };
  console.log("Creating User", see_obj);
  await addUserToDatabase(see_obj);
}

async function lookupUserFunc(payload) {
  // see if user is already in Userfront
  const f_data = await findUserfrontUser(payload)
    .then((response) => {
      console.log("Userfront search result", response);
      if (response) {
        console.log("Userfront User Found", response);
        return response;
      }
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("Userfront search result", f_data);
  // if no Userfront user, create one.
  let c_data
  if (f_data.totalCount === 0) {
    c_data = await createUserfrontUser(payload)
      .then((response) => {
        console.log("User Created", response);
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
        return null;
      });
    console.log("User Created", c_data);
  }
  // see if user is in the database
  const cd = await lookupUserByEmail(payload)
    .then((response) => {
      console.log("User Found", response);
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("User Found: ", cd);
  // if no local user, create one
  if (cd === null) {
    const see_obj = {
      username: payload.username,
      customer: payload.name,
      customer_details: {
        email: payload.email,
        name: payload.name,
        address: {
          line_1: "",
          line_2: "",
          city: "",
          state: "",
          postal_code: "",
        },
      },
      lic_key: "",
      prod_type: "free",
      expire_date: "",
      userfront_id: c_data.userUuid,
    };
    const newUser = await addUserToDatabase(see_obj)
      .then(async () => {
        await prisma.$disconnect();
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
      });
    console.log("User Created", newUser);
  }
  // email account details
  emailAccountDetails(payload);
}

/**
 * Request to Find a user in the database /user-data
 * @param {*} username
 * @returns
 */
app.post(
  "/user-data",
  express.json({ type: "application/json" }),
  (req, resp) => {
    const payload = JSON.parse(req.body);
    console.log("User Data", payload.username);
    console.log("Data Fetch: ", payload.data_fetch);
    // resp.status(200).end();
    const data = lookupUser(payload.username);
    data
      .then((response) => {
        switch (payload.data_fetch) {
          case "all":
            resp.write(JSON.stringify(response));
            resp.status(200).end();
            break;
          case "main_settings":
            resp.write(JSON.stringify(response.main_settings));
            resp.status(200).end();
            break;
          case "bitly_settings":
            resp.write(JSON.stringify(response.bitly_settings));
            resp.status(200).end();
            break;
          case "utm_settings":
            const utm_settings = {
              utm_campaign: response.utm_campaign,
              utm_keyword: response.utm_keyword,
              utm_content: response.utm_content,
              utm_medium: response.utm_medium,
              utm_source: response.utm_source,
              utm_term: response.utm_term,
            };
            resp.write(JSON.stringify(utm_settings));
            resp.status(200).end();
            break;
          case "qr_settings":
            resp.write(JSON.stringify(response.qr_settings));
            resp.status(200).end();
            break;
          case "user_settings":
            resp.write(JSON.stringify(response));
            resp.status(200).end();
            break;
          case "wifi_settings":
            resp.write(JSON.stringify(response.wifi_settings));
            resp.status(200).end();
            break;
          case "link_history":
            resp.write(JSON.stringify(response.link_history));
            resp.status(200).end();
            break;
          case "license_settings":
            resp.write(JSON.stringify(response.licensing));
            resp.status(200).end();
            break;
          default:
            resp.write(JSON.stringify(response));
            resp.status(200).end();
            break;
        }

      })
      .catch(async (e) => {
        console.error(e);
      });
  }
);

/**
 * Create a user in the app -- first Userfront, then the database /create-user
 * @param {*} payload
 * @returns
 * @throws
 */
app.post(
  "/create-user",
  express.json({ type: "application/json" }),
  (req, resp) => {
    const payload = JSON.parse(req.body);
    console.log("Create User", payload);
    const found = lookupUserFunc(payload);
    console.log("User Found", found);
  }
);

/**
 * checkout a machine for a license
 */
app.post(
  "/fetchMachine",
  json.raw({ type: "application/json" }),
  (req, resp) => {
    const payload = JSON.parse(req.body);
    console.log("Fetch Machine", payload);
    const mData = getMachine(payload);
    mData
      .then((response) => {
        console.log("Machine Data", response);
        resp.write(JSON.stringify(response));
        resp.status(200).end();
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
      });
    //     const data = lookupUser(payload.username);
    // data
    //   .then((response) => {
    //     console.log("User Data", response);
    //     resp.write(JSON.stringify(response));
    //     resp.status(200).end();
    //     async () => {
    //       await prisma.$disconnect();
    //     };
    //   })
    //   .catch(async (e) => {
    //     console.error(e);
    //     await prisma.$disconnect();
    //     // process.exit(1);
    //   });
  });
/**
 * Webhook handler for asynchronous payment events
 * @param {*} session - The Stripe session object
 */
app.post(
  "/webhook",
  json.raw({ type: "application/json" }),
  (request, response) => {
    const payload = request.body;
    const sig = request.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      console.log("Webhook Event", event);
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
    let subscription;
    let status;
    // Handle the event
    switch (event.type) {
      case "customer.subscription.trial_will_end":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}. and will end`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case "customer.subscription.deleted":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case "customer.subscription.created":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case "customer.subscription.updated":
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
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
          console.log("Session is paid, fulfilling order", session);

          // gatherCustomerData(session);
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
        response.status(200).redirect("/myAccount")
        break;
      }
    }
    response.status(200).end();
  }
);

/**
 * Webhook handler for subscription events
 *
 */
app.post("/keygen-webhooks", async (req, res) => {
  const {
    data: { id: keygenEventId },
  } = req.body;
  const payload = req.body;
  res.header("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify({ received: true })).end();
  console.log("Keygen Webhook", payload);
  console.log("Keygen Webhook", req.body);
  // Fetch the webhook to validate it and get its most up-to-date state
  const keygenWebhook = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/webhook-events/${keygenEventId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
        Accept: "application/vnd.api+json",
      },
    }
  );

  const { data: keygenEvent, errors } = await keygenWebhook.json();
  if (errors) {
    console.log(errors.map((e) => e.detail).toString());
    return res.sendStatus(200); // Event does not exist (wasn't sent from Keygen)
  }

  switch (keygenEvent.attributes.event) {
    // 1. Respond to user creation events within your Keygen account. Here, we'll create
    //    a new Stripe customer account for new Keygen users.
    case "user.created":
      console.log(
        `Received user.created event for user ${keygenEvent.attributes.payload}`
      );
      const { data: keygenUser } = JSON.parse(keygenEvent.attributes.payload);

      // Make sure our Keygen user has a Stripe token, or else we can't charge them later on..
      if (!keygenUser.attributes.metadata.stripeToken) {
        console.log(
          `User ${keygenUser.id} does not have a Stripe token attached to their user account!`
        );
        throw new Error(
          `User ${keygenUser.id} does not have a Stripe token attached to their user account!`
        );
      }

      // 2. Create a Stripe customer, making sure we use our Stripe token as their payment
      //    method of choice.
      const stripeCustomer = await stripe.customers.create({
        description: `Customer for Keygen user ${keygenUser.attributes.email}`,
        email: keygenUser.attributes.email,
        // Source is a Stripe token obtained with Stripe.js during user creation and
        // temporarily stored in the user's metadata attribute.
        source: keygenUser.attributes.metadata.stripeToken,
        // Store the user's Keygen ID within the Stripe customer so that we can lookup
        // a Stripe customer's Keygen account.
        metadata: { keygenUserId: keygenUser.id },
      });

      // 3. Add the user's Stripe customer ID to the user's metadata attribute so that
      //    we can lookup their Stripe customer account when needed.
      const update = await fetch(
        `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/users/${keygenUser.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
          body: JSON.stringify({
            data: {
              type: "users",
              attributes: {
                metadata: { stripeCustomerId: stripeCustomer.id },
              },
            },
          }),
        }
      );

      const { data, errors } = await update.json();
      if (errors) {
        console.log(errors.map((e) => e.detail).toString());
        throw new Error(errors.map((e) => e.detail).toString());
      }
      console.log(
        `Successfully updated user ${keygenUser.id} with Stripe customer ID ${stripeCustomer.id}`
      );
      // All is good! Stripe customer was successfully created for the new Keygen
      // user. Let Keygen know the event was received successfully.
      res.sendStatus(200);
      break;
    default:
      // For events we don't care about, let Keygen know all is good.
      res.sendStatus(200);
  }
});

/**
 * Update Main Settings in database
 */
app.post("/update-main-settings", (req, resp) => {
  const payload = JSON.parse(req.body);
  console.log("Update Main Settings", payload);
  const data = updateMainSettings(payload);
  data
    .then((response) => {
      console.log("User Data", response);
      resp.write(JSON.stringify(response));
      resp.status(204).end();
      async () => {
        await prisma.$disconnect();
      };
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      // process.exit(1);
    });
});

/**
 * Update Main Settings in database
 */
app.post("/update-user-settings", (req, resp) => {
  const payload = JSON.parse(req.body);
  console.log("Update User Settings", payload);
  const data = updateUserSettings(payload);
  data
    .then((response) => {
      console.log("User Data", response);
      resp.write(JSON.stringify(response));
      resp.status(204).end();
      async () => {
        await prisma.$disconnect();
      };
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      // process.exit(1);
    });
});
/**
 * Update bitly settings in database
 * @param {*} payload
 */
app.post("/update-bitly-settings", (req, resp) => {
  const payload = JSON.parse(req.body);
  console.log("Update Bitly Settings", payload);
  const data = updateBitlySettings(payload);
  data
    .then((response) => {
      console.log("User Data", response);
      resp.write(JSON.stringify(response));
      resp.status(204).end();
      async () => {
        await prisma.$disconnect();
      };
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      // process.exit(1);
    });
});

/**
 * Update UTM settings in database
 * @param {*} payload
 */
app.post("/update-utm-settings", (req, resp) => {
  const payload = JSON.parse(req.body);
  console.log("Update UTM Settings", payload);
  const data = updateUTMSettings(payload);
  data
    .then((response) => {
      console.log("User Data", response);
      resp.write(JSON.stringify(response));
      resp.status(204).end();
      async () => {
        await prisma.$disconnect();
      };
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      // process.exit(1);
    });
});

/**
 * Update QR Style settings in database
 * @param {*} payload
 */
app.post("/update-qr-settings", (req, resp) => {
  const payload = JSON.parse(req.body);
  console.log("Update QR Settings", payload);
  const data = updateQRSettings(payload);
  data
    .then((response) => {
      console.log("User Data", response);
      resp.write(JSON.stringify(response));
      resp.status(204).end();
      async () => {
        await prisma.$disconnect();
      };
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      // process.exit(1);
    });
});

console.log(`Server running at http://localhost:4242/`);
console.log(`Stripe Webhook Secret: ${endpointSecret}`);
console.log(`Stripe Secret Key: ${stripe.key}`);
console.log(`Keygen ID: ${KEYGEN_ACCOUNT_ID}`);
console.log(`Keygen Product Token: ${KEYGEN_PRODUCT_TOKEN}`);
app.listen(4242, () => console.log("Running on port 4242"));
