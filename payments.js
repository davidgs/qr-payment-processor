import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import express from "express";
import json from "body-parser";
import crypto from "crypto";
import axios from "axios";
import cors from "cors";
import {
  updateBitlySettings,
  updateMainSettings,
  updateQRSettings,
  updateUTMSettings,
  updateUserSettings,
  lookupUser,
  lookupUserByEmail,
  addUserToDatabase,
  lookupStripeCustomer,
  updateLicenseSettings,
  lookupKeygenUser,
} from "./database.js";
import { createUserfrontUser, findUserfrontUser } from "./userfrontActions.js";
import { getMachine, deleteLicense } from "./keygenActions.js";
import { emailAccountDetails, sendFailMail, sendSubDeletedEmail } from "./mailer.js";

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
const stripe = new Stripe(STRIPE_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});
stripe.key = process.env.STRIPE_KEY;
// Using Express
const app = express();
app.use(cors());
// Use JSON parser for all non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

/* Date Format String to use
 * Apr 03, 2024 at 11:07 AM EDT
 */
const dtf = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

/**
 * Process a user-generated cancellation
 */
async function processCancellation(session) {
  console.log("Processing Cancellation", session);
  const cust_id = session.username;
  const user = await lookupKeygenUser(cust_id)
    .then((response) => {
      console.log(
        response === null || response.length === 0
          ? "No User Found"
          : "User found: ",
        response
      );
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("User Found", user);
  if (user.length > 0) {
    const username = user[0].login;
    const updatedUser = await prisma.user
      .update({
        where: {
          login: username,
        },
        data: {
          deleted_at: new Date(),
          updated_at: new Date(),
          licensing: {
            update: {
              active: false,
              confirmed: false,
              license_status: "cancelled",
              license_type: "free",
              license_key: "",
              updated_at: new Date(),
              deleted_at: new Date(),
              expire_date: new Date(),
            },
          },
        },
      })
      .then((response) => {
        async () => {
          await prisma.$disconnect();
        };
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
      });
    console.log("User Updated", updatedUser);
    const cancel_payload = {
      id: updatedUser.keygen_id
    };
    const deleted = await deleteLicense(cancel_payload)
      .then((response) => {
        console.log("License Deleted", response);
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
        return null;
      });
    console.log("License Deleted", deleted);
  }
  const emailProps = {
    email: user[0].email,
    name:  `${user[0].first_name} ${user[0].last_name}`,
  };
  // cancel stripe payment
  const customer = await stripe.customers
    .retrieve(user[0].stripe_id)
    .then((response) => {
      console.log("Customer Found", response);
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("Customer Found", customer);
  const sub = await stripe.subscriptions
    .list({ customer: user[0].stripe_id })
    .then((response) => {
      console.log("Subscription Found", response);
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("Subscription Found", sub);
  const sub_id = sub.data[0].id;
  const cancelled = await stripe.subscriptions
    .cancel(sub_id)
    .then((response) => {
      console.log("Subscription Cancelled", response);
      return response;
    })

    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("Subscription Cancelled", cancelled);
  console.log("emailing customer about deleted license...");
  sendSubDeletedEmail(emailProps);
}
/**
 * Cancel a subscription from Stripe
 * @param {*} session
 */
async function cancelSubscription(session) {
  console.log("Cancelling subscription", session);
  const c_id = session.customer;
  const user = await lookupStripeCustomer(c_id)
    .then((response) => {
      console.log(
        response === null || response.length === 0
          ? "No User Found"
          : "User found: ",
        response
      );
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("User Found", user);
  if (user.length > 0) {
    const username = user[0].login;
    const updatedUser = await prisma.user
      .update({
        where: {
          login: username,
        },
        data: {
          updated_at: new Date(),
          deleted_at: new Date(),
          licensing: {
            update: {
              active: false,
              confirmed: false,
              license_status: "cancelled",
              license_type: "free",
              license_key: "",
              updated_at: new Date(),
              deleted_at: new Date(),
            },
          },
        },
      })
      .then((response) => {
        async () => {
          await prisma.$disconnect();
        };
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
      });
    console.log("User Updated", updatedUser);
    const cancel_payload = {
      id: updatedUser.keygen_id,
    };
    const deleted = await deleteLicense(cancel_payload)
      .then((response) => {
        console.log("License Deleted", response);
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
        return null;
      });
    console.log("License Deleted", deleted);
  }
  const emailProps = {
    email: user[0].email,
    name: user[0].name,
  };
  console.log("emailing customer about deleted license...");
  sendSubDeletedEmail(emailProps);
}
/**
 * Fulfill the order once it's paid.
 * @param {*} session
 */
async function fulfillOrder(session, resp) {
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
      lic = await createLicense(session, tag)
        .then((response) => {
          console.log("License Generated", response);
          return response;
        })
        .catch(async (e) => {
          console.error(e);
          resp.status(500).end();
          return null;
        });
      break;
    case "prod_PTiLGOv1vWNLTE": // qrcode pro
      console.log(`Fulfilling order ${type} ProductID: ${product}`);
      lic = await createLicense(session, tag)
        .then((response) => {
          console.log("License Generated", response);
          return response;
        })
        .catch(async (e) => {
          console.error(e);
          resp.status(500).end();
          return null;
        });
      break;
    case "prod_PVW8bgwnAdrsw2": // qrcode enterprise
      console.log(`Fulfilling order for ${type} ProductID: ${product}`);
      lic = await createLicense(session, tag)
        .then((response) => {
          console.log("License Generated", response);
          return response;
        })
        .catch(async (e) => {
          console.error(e);
          resp.status(500).end();
          return null;
        });
      break;
    default:
      console.log("Product not found");
      resp.status(500).end();
  }
  // licensing failed
  if (!lic) {
    // send license failed email
    console.log("License Generation Failed");
    resp.status(500).end();
  }
  // see if user is already in database:
  const username = `${session.customer_details.name
    .toLowerCase()
    .replace(" ", "_")}`;
  const user = await lookupUserByEmail({
    username: username,
    email: session.customer_details.email,
  })
    .then((response) => {
      console.log(
        response === null ? "No User Found" : "User found: ",
        response
      );
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  // see if user is in userfront
  const uf = await findUserfrontUser({
    username: username,
    email: session.customer_details.email,
  });
  console.log("Userfront User Found", uf.totalCount > 0);
  // No Userfront Account, so create one.
  let ufUUID = "";
  let pw;
  if (uf.totalCount === 0) {
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
    ufUUID = f.userUuid;
    pw = f.password;
  } else {
    ufUUID = uf.results[0].uuid;
    pw = uf.results[0].password;
  }
  // User is in the local database & we have a license, so update the user with the license key
  if (user) {
    const updatedUser = await prisma.user
      .update({
        where: {
          login: username,
        },
        data: {
          updated_at: new Date(),
          keygen_id: lic.data.relationships.account.data.id,
          stripe_id: session.customer,
          userfront_id: ufUUID,
          first_name: session.customer_details.name.split(" ")[0],
          last_name: session.customer_details.name.split(" ")[1],
          organization: "",
          address: session.customer_details.address?.line1 || "",
          city: session.customer_details.address?.city || "",
          state: session.customer_details.address?.state || "",
          zip: session.customer_details.address?.postal_code || "",
          licensing: {
            upsert: {
              create: {
                cust_id: lic.id,
                active: lic.data.attributes.active === "ACTIVE" ? true : false,
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
      })
      .then((response) => {
        async () => {
          await prisma.$disconnect();
        };
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
      });
    console.log("User Updated", updatedUser);
  } else {
    // User is not in the local database & we have a license add them to the database
    const newUser = await addUserToDatabase(session)
      .then((response) => {
        console.log("User Created", response);
        return response;
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
        return null;
      });
    console.log("User Created", newUser);
    // then update the user with the userfront ID
    const updatedUser = await prisma.user
      .update({
        where: {
          login: username,
        },
        data: {
          updated_at: new Date(),
          userfront_id: ufUUID,
          stripe_id: session.customer,
        },
      })
      .then((response) => {
        async () => {
          await prisma.$disconnect();
        };
        return response;
      })
      .catch((e) => {
        console.error(e);
        async () => {
          await prisma.$disconnect();
        };
        return null;
      });
    console.log("User Updated with Userfront ID", updatedUser);
  }
  const lup = await updateLicenseSettings({
    username: username,
    settings: lic,
  })
    .then((response) => {
      console.log("License Updated", response);
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    });
  console.log("License Updated", lup);
  const mail_data = {
    email: session.customer_details.email,
    name: session.customer_details.name,
    username: username,
    password: pw,
    start_date: dtf.format(new Date()),
    end_date: dtf.format(new Date(lic.data.attributes.expiry)),
    action_url: "https://qr-builder.io/login",
    trial_length: "7",
    license_type: type,
    license_key: lic.data.attributes.key,
  };
  // email the user with their account details
  emailAccountDetails(mail_data);
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
              customerName: session.customer_details.name,
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
    console.log("License Generated", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating license:", error.message);
    throw new Error("License Generation Failed");
  }
}

async function emailCustomerAboutFailedPayment (session, resp) {
  const err_mess = session.last_setup_error.message; // -- the message
  const card = session.last_setup_error.payment_method.card.brand; // -- the card
  const ending = session.last_setup_error.payment_method.card.last4; // the last 4 of the card
  const name = session.last_setup_error.payment_method.billing_details.name; // the name on the card
  const email = session.last_setup_error.payment_method.billing_details.email; // the email
  const email_obj = {
    email: email,
    name: name,
    card: card,
    card_number: ending,
    error: err_mess,
  };
  const fail = await sendFailMail(email_obj)
    .then((response) => {
      console.log("Email Sent", response);
      resp.write(JSON.stringify(response));
      resp.status(200).end();
      return response;
    })
    .catch(async (e) => {
      console.error(e);
      resp.status(500).end();
      return null;
    }
  );
  console.log("Email Sent", fail);
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

async function lookupUserFunc(resp, payload) {
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
  let c_data;
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
  } else {
    resp.write(JSON.stringify({ error: "User Account already exists" }));
    resp.status(200).end();
    return;
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
  const date = new Date();
  const theDayOfTheMonthOnNextWeek = date.getDate() + 7;
  date.setDate(theDayOfTheMonthOnNextWeek);
  const mail_obj = {
    email: payload.email,
    name: payload.name,
    username: payload.username,
    password: payload.password,
    start_date: dtf.format(new Date()),
    end_date: dtf.format(date),
    action_url: "https://qr-builder.io/login",
    trial_length: "7",
    license_type: "",
    license_key: "",
  };
  console.log("Emailing customer", mail_obj);
  emailAccountDetails(mail_obj);
}

/**
 * Request to Find a user in the database /user-data
 * @param {*} username
 * @returns
 */
app.post(
  "/api/user-data",
  express.json({ type: "application/json" }),
  (req, resp) => {
    const payload = req.body;
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
              utm_target: response.utm_target,
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
  "/api/create-user",
  express.json({ type: "application/json" }),
  (req, resp) => {
    const payload = req.body;
    console.log("Create User", payload);
    const found = lookupUserFunc(resp, payload);
    console.log("User Found", found);
  }
);

/**
 * Delete a users license
 * @param {*} payload
 * @returns
 * @throws
 */
app.post(
  "/api/delete-license",
  express.json({ type: "application/json" }),
  (req, resp) => {
    const payload = req.body;
    console.log("Delete User License", payload);
    const found = processCancellation(payload)
      .then((response) => {
        console.log("User Found", response);
        resp.write(JSON.stringify(response));
        resp.status(200).end();
      })
      .catch(async (e) => {
        console.error(e);
        resp.status(500).end();
      });

    console.log("User Found", found);
  }
);
/**
 * checkout a machine for a license
 */
app.post(
  "/api/fetchMachine",
  json.raw({ type: "application/json" }),
  (req, resp) => {
    const payload = req.body;
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
  }
);
/**
 * Webhook handler for asynchronous payment events
 * @param {*} session - The Stripe session object
 */
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_ENDPOINT_SECRET
    );
  } catch (err) {
    // On error, log and return the error message
    console.log(`❌ Error message: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Successfully constructed event
  console.log("✅ Success:", event.type, event.id);
  const payload = req.body;
  let subscription;
  let status;
  // Handle the event
  switch (event.type) {
    case "customer.subscription.trial_will_end":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}. and will end`);
      // sendSubEndingEmail(subscription);
      // Then define and call a method to handle the subscription trial ending.
      // handleSubscriptionTrialEnding(subscription);
      break;
    case "customer.subscription.deleted":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      const ex_date = subscription.current_period_end;
      console.log(
        `Subscription expires on ${dtf.format(new Date(ex_date * 1000))}`
      );
      cancelSubscription(subscription);
      // remove users' licenses
      // sendSubDeletedEmail(subscription);
      // Then define and call a method to handle the subscription deleted.
      // handleSubscriptionDeleted(subscriptionDeleted);
      break;
    case "customer.updated":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
    // Then define and call a method to handle the subscription updated.
    // handleSubscriptionUpdated(subscription);
    case "customer.subscription.pending_update":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
      // Then define and call a method to handle the subscription pending update.
      // handleSubscriptionPendingUpdate(subscription);
      break;
    case "invoice.paid":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
    // Then define and call a method to handle the invoice paid.
    // handleInvoicePaid(subscription);
    case "invoice.payment_failed":
      subscription = event.data.object;
      status = subscription.status;
      console.log(`Subscription status is ${status}.`);
    // Then define and call a method to handle the invoice payment failed.
    // handleInvoicePaymentFailed(subscription);

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
      console.log(`Subscription for status is ${status}.`);
      // Then define and call a method to handle the subscription update.
      // handleSubscriptionUpdated(subscription);
      res.status(200).redirect("https://qr-builder.io/login");
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
        fulfillOrder(session, res);
        res.status(200).redirect("https://qr-builder.io/login");
        res.end();
      }

      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      console.log("Session async payment succeeded", session);
      // Fulfill the purchase...
      fulfillOrder(session, res);
      res.status(200).redirect("https://qr-builder.io/login");
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      console.log("`❌ Session async payment failed", session);

      // Send an email to the customer asking them to retry their order
      emailCustomerAboutFailedPayment(session, res);
      res.status(200).end(); //redirect("https://qr-builder.io/");
      break;
    }
    case "setup_intent.setup_failed": {
      const session = event.data.object;
      console.log("❌ Setup intent failed", session);

      // Send an email to the customer asking them to retry their order
      emailCustomerAboutFailedPayment(session, res);
      res.status(200).end(); //redirect("https://qr-builder.io/");
      break;
    }
  }
  res.status(200).end();
});

/**
 * Webhook handler for subscription events
 *
 */
app.post("/api/keygen-webhooks", async (req, res) => {
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
app.post("/api/update-main-settings", (req, resp) => {
  const payload = req.body;
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
app.post("/api/update-user-settings", (req, resp) => {
  const payload = req.body;
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
app.post("/api/update-bitly-settings", (req, resp) => {
  const payload = req.body;
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
app.post("/api/update-utm-settings", (req, resp) => {
  const payload = req.body;
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
app.post("/api/update-qr-settings", (req, resp) => {
  const payload = req.body;
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
