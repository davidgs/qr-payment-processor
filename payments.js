import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import express from "express";
import json from "body-parser";
import crypto from "crypto";
import axios from "axios";
import cors from "cors";

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
if (!STRIPE_KEY || !endpointSecret || !KEYGEN_ACCOUNT_ID || !stripe_secret || !KEYGEN_PRODUCT_TOKEN) {
  process.exit(1);
}
const stripe = new Stripe(STRIPE_KEY);
stripe.key = process.env.STRIPE_KEY;
// Using Express
const app = express();
app.use(json.json());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  })
);
// Use body-parser to retrieve the raw body as a buffer

const fulfillOrder = (session) => {
  // TODO: fill me in
  const lineItems = session.line_items;
  console.log("Fulfilling order", lineItems);
  console.log("Fulfilling order", session);
};

const createOrder = (session) => {
  // TODO: fill me in
  console.log("Creating order", session);
};

/**
 * generate a random 10-character password string
 * @returns
 */
function generatePass() {
  let pass = "";
  const str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "abcdefghijklmnopqrstuvwxyz0123456789@#$-_&*!%?";
  for (let i = 1; i <= 10; i++) {
    pass += str.charAt(Math.floor(Math.random() * str.length + 1));
  }
  return pass;
}

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
      break;
    case "enterprise-yearly":
      lic_type = "prod_6";
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
    return response.data.data.attributes.key;
  } catch (error) {
    console.error("Error generating license:", error.message);
    throw new Error("License Generation Failed");
  }
}

/**
 *
 * @param {*} username
 * @returns
 */
async function findUser(username) {
  const exists = await prisma.user
    .findUnique({
      where: {
        login: username,
      },
    })
    .then((exists) => {
      console.log("User Exists", exists);
    })
    .catch((error) => console.log("Error: ", error));
  return exists;
}
/**
 *
 * @param {*} session
 */
async function addUserToDatabase(session) {
  let localUserExists = false;
  const exists = await prisma.user
    .findUnique({
      where: {
        login: session.customer,
      },
    })
    .then((exists) => {
      if (exists) {
        localUserExists = true;
        console.log("User Exists", exists);
      } else {
        console.log("User Does Not Exist");
      }
    })
    .catch((error) => console.log("Error: ", error));
  const payload = {
    order: "lastActiveAt_ASC",
    page: 1,
    filters: {
      conjunction: "and",
      filterGroups: [
        {
          conjunction: "and",
          filters: [
            {
              attr: "username",
              type: "string",
              comparison: "is",
              value: session.customer,
            },
          ],
        },
      ],
    },
  };
  let userfrontUser = false;
  let userfrontData = {};
  await fetch("https://api.userfront.com/v0/tenants/xbp876mb/users/find", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer uf_test_admin_xbp876mb_1ff44b31e3c9c0fd2bd50330641cb907",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Got: ", data);
      if (data.totalCount === 0) {
        console.log("No user found");
      } else if (data.totalCount === 1) {
        userfrontUser = true;
        console.log("User found");
        userfrontData = data.results[0];
      } else {
        // Whiskey Tango Foxtrot
        console.log("Users found: ", data.totalCount);
      }
    })
    .catch((error) => console.log("Error: ", error));
  if (!userfrontUser) {
    // create a new userfront user
    console.log("Creating Userfront User");
  }
  if (!localUserExists) {
    // create a new user in the database
    console.log("Creating Local User");
  } else {
    console.log("User Exists");
    // update user record in database
  }
  if (exists) {
    console.log("User Exists", exists);
    const userfront = exists.userfront;
    console.log("User Exists", userfront);
    if (!userfront) {
      const password = generatePass();
      console.log("No Userfront Account Exists", userfront);
      // Userfront.signup({
      //   method: "password",
      //   email: email,
      //   password: password,
      //   username: realName?.replace(" ", "_").toLowerCase(),
      //   name: realName,
      //   data: { license: lic_type, license: response },
      //   // redirect: "/custom-path"
      // });
      // create userfront account
    }
  }
  if (!exists) {
    const user = await prisma.user
      .create({
        data: {
          login: session.customer,
          stripe_id: generatePass(),
          first_name: session.customer_details.name.split(" ")[0],
          last_name: session.customer_details.name.split(" ")[1],
          organization: "",
          address: session.customer_details.address.line_1,
          city: session.customer_details.address.city,
          state: session.customer_details.address.state,
          zip: session.customer_details.address.postal_code,
          email: session.customer_details.email,
          active: true,
          confirmed: true,
          licensing: {
            create: {
              cust_id: session.customer,
              active: false,
              confirmed: true,
              license_key: session.lic_key || "",
              license_type: session.prod_type || "free",
              expire_date: session.expire_date,
            },
          },
          main_settings: {
            create: {
              brand_image: "",
              brand_height: 200,
              brand_width: 200,
              brand_opacity: 1.0,
              form_type: "simple",
              dark: false,
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
          utm_term: {
            create: {
              use_value: true,
              is_chooser: false,
              show_name: true,
              label: "Referral Term",
              tooltip: "Enter a referral term",
              error: "Please enter a valid referral term",
              aria_label: "Referral Term",
              value: [],
            },
          },
          qr_settings: {
            create: {
              value: "",
              ec_level: "M",
              enable_CORS: true,
              size: 220,
              quiet_zone: 10,
              bg_color: "rgba(255,255,255,1)",
              fg_color: "rgba(0,0,0,1)",
              logo_image: "",
              logo_width: 60,
              logo_height: 60,
              logo_opacity: 1.0,
              remove_qr_code_behind_logo: true,
              logo_padding: 0,
              logo_padding_style: "square",
              top_l_eye_radius: [0, 0, 0, 0],
              top_r_eye_radius: [0, 0, 0, 0],
              bottom_l_eye_radius: [0, 0, 0, 0],
              eye_color: "rgba(0,0,0,1)",
              qr_style: "squares",
              qr_type: "png",
              x_parent: false,
            },
          },
        },
        // send email with username/password and license key
      })
      .then(async () => {
        await prisma.$disconnect();
      })
      .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
      });

    console.log("User Created", user);
  }
}
/**
 * Create a user in the database
 * @param {*} session
 * @returns
 * @throws
 **/
async function gatherCustomerData(session) {
  const userName = session.customer;
  console.log("Creating user", userName);
  const email = session.customer_details?.email;
  console.log("Creating user", email);
  const realName = session.customer_details?.name;
  const login = realName?.replace(" ", "_").toLowerCase();
  console.log("Creating user", realName);
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
  const price = items.line_items.data[0].price.id;
  console.log("Creating Price", price);
  let expire_date = new Date();
  let prod_type = "";
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
    case "price_1OgV5rGuKQxVPasT044gOB4u":
      prod_type = "enterprise-monthly";
      expire_date.setMonth(expire_date.getMonth() + 1);
      break;
    case "price_1OgV6OGuKQxVPasTNpLMEMFS":
      prod_type = "enterprise-yearly";
      expire_date.setMonth(expire_date.getFullYear() + 1);
      break;
    default:
      prod_type = "basic-trial";
  }
  console.log("Expire Date", expire_date.toISOString());

  // Make a request to Keygen.sh to generate a license based on customer email
  const response = await createLicense(session, prod_type);

  console.log(`Response: ${response}`);
  const see_obj = {
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


/**
 *
 * @param string payload
 * @returns
 */
async function lookupUser(payload) {
  console.log("Looking up user", payload);
  const username = payload;
  console.log("Looking up username", username);
  let localUserExists = false;
  const exists = await prisma.user
    .findUnique({
      relationLoadStrategy: "join",
      include: {
        licensing: true,
        qr_settings: true,
        main_settings: true,
        bitly_settings: true,
        utm_campaign: true,
        utm_keyword: true,
        utm_content: true,
        utm_medium: true,
        utm_source: true,
        utm_target: true,
        utm_term: true,
      },
      where: {
        login: username,
      },
    })
    .then((user) => {
      localUserExists = true;
      console.log("User Exists", user);
      return user;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return error;
    });
  if (localUserExists) {
    return exists;
  }
}

/**
 * Update Bitly Settings in database
 */

async function updateBitlySettings(payload) {
  console.log("Updating Bitly Settings", payload);
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        bitly_settings: {
          upsert: {
            create: {
              use_value: payload.settings.use_value,
              label: payload.settings.label,
              aria_label: payload.settings.aria_label,
              tooltip: payload.settings.tooltip,
              error: payload.settings.error,
              bitly_token: payload.settings.bitly_token,
              bitly_domain: payload.settings.bitly_domain,
              bitly_addr: payload.settings.bitly_addr,
              bitly_enabled: payload.settings.bitly_enabled,
              type: payload.settings.type,
              updated_at: new Date(),
            },
            update: {
              use_value: payload.settings.use_value,
              label: payload.settings.label,
              aria_label: payload.settings.aria_label,
              tooltip: payload.settings.tooltip,
              error: payload.settings.error,
              bitly_token: payload.settings.bitly_token,
              bitly_domain: payload.settings.bitly_domain,
              bitly_addr: payload.settings.bitly_addr,
              bitly_enabled: payload.settings.bitly_enabled,
              type: payload.settings.type,
              updated_at: new Date(),
            },
          },
          update: {
            use_value: payload.settings.use_value,
            label: payload.settings.label,
            aria_label: payload.settings.aria_label,
            tooltip: payload.settings.tooltip,
            error: payload.settings.error,
            bitly_token: payload.settings.bitly_token,
            bitly_domain: payload.settings.bitly_domain,
            bitly_addr: payload.settings.bitly_addr,
            bitly_enabled: payload.settings.bitly_enabled,
            type: payload.settings.type,
            updated_at: new Date(),
          },
        },
      },
      include: {
        bitly_settings: true,
      },
    })
    .then((user) => {
      console.log("User Updated", user);
      return user;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return error;
    });
  return updateUser;
}
/**
 * Update Main Settings in database
 * @param {*} payload
 */

async function updateMainSettings(payload) {
  console.log("Updating Main Settings", payload);
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        main_settings: {
          upsert: {
            create: {
              brand_image: payload.settings.settings.brand_image,
              brand_height: payload.settings.settings.brand_height,
              brand_width: payload.settings.settings.brand_width,
              brand_opacity: payload.settings.settings.brand_opacity,
              form_type: payload.settings.settings.form_type,
              dark: payload.settings.dark,
            },
            update: {
              brand_image: payload.settings.settings.brand_image,
              brand_height: payload.settings.settings.brand_height,
              brand_width: payload.settings.settings.brand_width,
              brand_opacity: payload.settings.settings.brand_opacity,
              form_type: payload.settings.settings.form_type,
              dark: payload.settings.dark,
            },
          },
          update: {
            brand_image: payload.settings.settings.brand_image,
            brand_height: payload.settings.settings.brand_height,
            brand_width: payload.settings.settings.brand_width,
            brand_opacity: payload.settings.settings.brand_opacity,
            form_type: payload.settings.settings.form_type,
            dark: payload.settings.dark,
          },
        },
      },
      include: {
        main_settings: true,
      },
    })
    .then((user) => {
      console.log("User Updated", user);
      return user;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * Update Main Settings in database
 * @param {*} payload
 */

async function updateUTMSettings(payload) {
  console.log("Updating UTM Settings", payload);
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        utm_target: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_target.use_value,
              is_chooser: payload.settings.settings.utm_target.is_chooser,
              show_name: payload.settings.settings.utm_target.show_name,
              label: payload.settings.settings.utm_target.label,
              tooltip: payload.settings.settings.utm_target.tooltip,
              error: payload.settings.settings.utm_target.error,
              aria_label: payload.settings.settings.utm_target.aria_label,
              value: payload.settings.settings.utm_target.value,
            },
            update: {
              use_value: payload.settings.settings.utm_target.use_value,
              is_chooser: payload.settings.settings.utm_target.is_chooser,
              show_name: payload.settings.settings.utm_target.show_name,
              label: payload.settings.settings.utm_target.label,
              tooltip: payload.settings.settings.utm_target.tooltip,
              error: payload.settings.settings.utm_target.error,
              aria_label: payload.settings.settings.utm_target.aria_label,
              value: payload.settings.settings.utm_target.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_target.use_value,
            is_chooser: payload.settings.settings.utm_target.is_chooser,
            show_name: payload.settings.settings.utm_target.show_name,
            label: payload.settings.settings.utm_target.label,
            tooltip: payload.settings.settings.utm_target.tooltip,
            error: payload.settings.settings.utm_target.error,
            aria_label: payload.settings.settings.utm_target.aria_label,
            value: payload.settings.settings.utm_target.value,
          },
        },
        utm_keyword: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_keyword.use_value,
              is_chooser: payload.settings.settings.utm_keyword.is_chooser,
              show_name: payload.settings.settings.utm_keyword.show_name,
              label: payload.settings.settings.utm_keyword.label,
              tooltip: payload.settings.settings.utm_keyword.tooltip,
              error: payload.settings.settings.utm_keyword.error,
              aria_label: payload.settings.settings.utm_keyword.aria_label,
              value: payload.settings.settings.utm_keyword.value,
            },
            update: {
              use_value: payload.settings.settings.utm_keyword.use_value,
              is_chooser: payload.settings.settings.utm_keyword.is_chooser,
              show_name: payload.settings.settings.utm_keyword.show_name,
              label: payload.settings.settings.utm_keyword.label,
              tooltip: payload.settings.settings.utm_keyword.tooltip,
              error: payload.settings.settings.utm_keyword.error,
              aria_label: payload.settings.settings.utm_keyword.aria_label,
              value: payload.settings.settings.utm_keyword.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_keyword.use_value,
            is_chooser: payload.settings.settings.utm_keyword.is_chooser,
            show_name: payload.settings.settings.utm_keyword.show_name,
            label: payload.settings.settings.utm_keyword.label,
            tooltip: payload.settings.settings.utm_keyword.tooltip,
            error: payload.settings.settings.utm_keyword.error,
            aria_label: payload.settings.settings.utm_keyword.aria_label,
            value: payload.settings.settings.utm_keyword.value,
          },
        },
        utm_content: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_content.use_value,
              is_chooser: payload.settings.settings.utm_content.is_chooser,
              show_name: payload.settings.settings.utm_content.show_name,
              label: payload.settings.settings.utm_content.label,
              tooltip: payload.settings.settings.utm_content.tooltip,
              error: payload.settings.settings.utm_content.error,
              aria_label: payload.settings.settings.utm_content.aria_label,
              value: payload.settings.settings.utm_content.value,
            },
            update: {
              use_value: payload.settings.settings.utm_content.use_value,
              is_chooser: payload.settings.settings.utm_content.is_chooser,
              show_name: payload.settings.settings.utm_content.show_name,
              label: payload.settings.settings.utm_content.label,
              tooltip: payload.settings.settings.utm_content.tooltip,
              error: payload.settings.settings.utm_content.error,
              aria_label: payload.settings.settings.utm_content.aria_label,
              value: payload.settings.settings.utm_content.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_content.use_value,
            is_chooser: payload.settings.settings.utm_content.is_chooser,
            show_name: payload.settings.settings.utm_content.show_name,
            label: payload.settings.settings.utm_content.label,
            tooltip: payload.settings.settings.utm_content.tooltip,
            error: payload.settings.settings.utm_content.error,
            aria_label: payload.settings.settings.utm_content.aria_label,
            value: payload.settings.settings.utm_content.value,
          },
        },
        utm_medium: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_medium.use_value,
              is_chooser: payload.settings.settings.utm_medium.is_chooser,
              show_name: payload.settings.settings.utm_medium.show_name,
              label: payload.settings.settings.utm_medium.label,
              tooltip: payload.settings.settings.utm_medium.tooltip,
              error: payload.settings.settings.utm_medium.error,
              aria_label: payload.settings.settings.utm_medium.aria_label,
              value: payload.settings.settings.utm_medium.value,
            },
            update: {
              use_value: payload.settings.settings.utm_medium.use_value,
              is_chooser: payload.settings.settings.utm_medium.is_chooser,
              show_name: payload.settings.settings.utm_medium.show_name,
              label: payload.settings.settings.utm_medium.label,
              tooltip: payload.settings.settings.utm_medium.tooltip,
              error: payload.settings.settings.utm_medium.error,
              aria_label: payload.settings.settings.utm_medium.aria_label,
              value: payload.settings.settings.utm_medium.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_medium.use_value,
            is_chooser: payload.settings.settings.utm_medium.is_chooser,
            show_name: payload.settings.settings.utm_medium.show_name,
            label: payload.settings.settings.utm_medium.label,
            tooltip: payload.settings.settings.utm_medium.tooltip,
            error: payload.settings.settings.utm_medium.error,
            aria_label: payload.settings.settings.utm_medium.aria_label,
            value: payload.settings.settings.utm_medium.value,
          },
        },
        utm_source: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_source.use_value,
              is_chooser: payload.settings.settings.utm_source.is_chooser,
              show_name: payload.settings.settings.utm_source.show_name,
              label: payload.settings.settings.utm_source.label,
              tooltip: payload.settings.settings.utm_source.tooltip,
              error: payload.settings.settings.utm_source.error,
              aria_label: payload.settings.settings.utm_source.aria_label,
              value: payload.settings.settings.utm_source.value,
            },
            update: {
              use_value: payload.settings.settings.utm_source.use_value,
              is_chooser: payload.settings.settings.utm_source.is_chooser,
              show_name: payload.settings.settings.utm_source.show_name,
              label: payload.settings.settings.utm_source.label,
              tooltip: payload.settings.settings.utm_source.tooltip,
              error: payload.settings.settings.utm_source.error,
              aria_label: payload.settings.settings.utm_source.aria_label,
              value: payload.settings.settings.utm_source.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_source.use_value,
            is_chooser: payload.settings.settings.utm_source.is_chooser,
            show_name: payload.settings.settings.utm_source.show_name,
            label: payload.settings.settings.utm_source.label,
            tooltip: payload.settings.settings.utm_source.tooltip,
            error: payload.settings.settings.utm_source.error,
            aria_label: payload.settings.settings.utm_source.aria_label,
            value: payload.settings.settings.utm_source.value,
          },
        },
        utm_term: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_term.use_value,
              is_chooser: payload.settings.settings.utm_term.is_chooser,
              show_name: payload.settings.settings.utm_term.show_name,
              label: payload.settings.settings.utm_term.label,
              tooltip: payload.settings.settings.utm_term.tooltip,
              error: payload.settings.settings.utm_term.error,
              aria_label: payload.settings.settings.utm_term.aria_label,
              value: payload.settings.settings.utm_term.value,
            },
            update: {
              use_value: payload.settings.settings.utm_term.use_value,
              is_chooser: payload.settings.settings.utm_term.is_chooser,
              show_name: payload.settings.settings.utm_term.show_name,
              label: payload.settings.settings.utm_term.label,
              tooltip: payload.settings.settings.utm_term.tooltip,
              error: payload.settings.settings.utm_term.error,
              aria_label: payload.settings.settings.utm_term.aria_label,
              value: payload.settings.settings.utm_term.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_term.use_value,
            is_chooser: payload.settings.settings.utm_term.is_chooser,
            show_name: payload.settings.settings.utm_term.show_name,
            label: payload.settings.settings.utm_term.label,
            tooltip: payload.settings.settings.utm_term.tooltip,
            error: payload.settings.settings.utm_term.error,
            aria_label: payload.settings.settings.utm_term.aria_label,
            value: payload.settings.settings.utm_term.value,
          },
        },
        utm_campaign: {
          upsert: {
            create: {
              use_value: payload.settings.settings.utm_campaign.use_value,
              is_chooser: payload.settings.settings.utm_campaign.is_chooser,
              show_name: payload.settings.settings.utm_campaign.show_name,
              label: payload.settings.settings.utm_campaign.label,
              tooltip: payload.settings.settings.utm_campaign.tooltip,
              error: payload.settings.settings.utm_campaign.error,
              aria_label: payload.settings.settings.utm_campaign.aria_label,
              value: payload.settings.settings.utm_campaign.value,
            },
            update: {
              use_value: payload.settings.settings.utm_campaign.use_value,
              is_chooser: payload.settings.settings.utm_campaign.is_chooser,
              show_name: payload.settings.settings.utm_campaign.show_name,
              label: payload.settings.settings.utm_campaign.label,
              tooltip: payload.settings.settings.utm_campaign.tooltip,
              error: payload.settings.settings.utm_campaign.error,
              aria_label: payload.settings.settings.utm_campaign.aria_label,
              value: payload.settings.settings.utm_campaign.value,
            },
          },
          update: {
            use_value: payload.settings.settings.utm_campaign.use_value,
            is_chooser: payload.settings.settings.utm_campaign.is_chooser,
            show_name: payload.settings.settings.utm_campaign.show_name,
            label: payload.settings.settings.utm_campaign.label,
            tooltip: payload.settings.settings.utm_campaign.tooltip,
            error: payload.settings.settings.utm_campaign.error,
            aria_label: payload.settings.settings.utm_campaign.aria_label,
            value: payload.settings.settings.utm_campaign.value,
          },
        },
      },
      include: {
        utm_target: true,
        utm_keyword: true,
        utm_content: true,
        utm_medium: true,
        utm_source: true,
        utm_term: true,
        utm_campaign: true,
      },
    })
    .then((user) => {
      console.log("User Updated", user);
      return user;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * Update QR Settings in database
 */
async function updateQRSettings(payload) {
  console.log("Updating QR Settings", payload);
  const updateUser = await prisma.user
    .update({
      where: {
        login: payload.username,
      },
      data: {
        qr_settings: {
          upsert: {
            create: {
              value: payload.settings.value,
              ec_level: payload.settings.ec_level,
              enable_CORS: payload.settings.enable_CORS,
              size: payload.settings.size,
              quiet_zone: payload.settings.quiet_zone,
              bg_color: payload.settings.bg_color,
              fg_color: payload.settings.fg_color,
              logo_image: payload.settings.logo_image,
              logo_width: payload.settings.logo_width,
              logo_height: payload.settings.logo_height,
              logo_opacity: payload.settings.logo_opacity,
              remove_qr_code_behind_logo: payload.settings.remove_qr_code_behind_logo,
              logo_padding: payload.settings.logo_padding,
              logo_padding_style: payload.settings.logo_padding_style,
              top_l_eye_radius: payload.settings.top_l_eye_radius,
              top_r_eye_radius: payload.settings.top_r_eye_radius,
              bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
              eye_color: payload.settings.eye_color,
              qr_style: payload.settings.qr_style,
              qr_type: payload.settings.qr_type,
              x_parent: payload.settings.x_parent,
            },
            update: {
              value: payload.settings.value,
              ec_level: payload.settings.ec_level,
              enable_CORS: payload.settings.enable_CORS,
              size: payload.settings.size,
              quiet_zone: payload.settings.quiet_zone,
              bg_color: payload.settings.bg_color,
              fg_color: payload.settings.fg_color,
              logo_image: payload.settings.logo_image,
              logo_width: payload.settings.logo_width,
              logo_height: payload.settings.logo_height,
              logo_opacity: payload.settings.logo_opacity,
              remove_qr_code_behind_logo: payload.settings.remove_qr_code_behind_logo,
              logo_padding: payload.settings.logo_padding,
              logo_padding_style: payload.settings.logo_padding_style,
              top_l_eye_radius: payload.settings.top_l_eye_radius,
              top_r_eye_radius: payload.settings.top_r_eye_radius,
              bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
              eye_color: payload.settings.eye_color,
              qr_style: payload.settings.qr_style,
              qr_type: payload.settings.qr_type,
              x_parent: payload.settings.x_parent,
            },
          },
          update: {
            value: payload.settings.value,
            ec_level: payload.settings.ec_level,
            enable_CORS: payload.settings.enable_CORS,
            size: payload.settings.size,
            quiet_zone: payload.settings.quiet_zone,
            bg_color: payload.settings.bg_color,
            fg_color: payload.settings.fg_color,
            logo_image: payload.settings.logo_image,
            logo_width: payload.settings.logo_width,
            logo_height: payload.settings.logo_height,
            logo_opacity: payload.settings.logo_opacity,
            remove_qr_code_behind_logo: payload.settings.remove_qr_code_behind_logo,
            logo_padding: payload.settings.logo_padding,
            logo_padding_style: payload.settings.logo_padding_style,
            top_l_eye_radius: payload.settings.top_l_eye_radius,
            top_r_eye_radius: payload.settings.top_r_eye_radius,
            bottom_l_eye_radius: payload.settings.bottom_l_eye_radius,
            eye_color: payload.settings.eye_color,
            qr_style: payload.settings.qr_style,
            qr_type: payload.settings.qr_type,
            x_parent: payload.settings.x_parent,
          },
        },
      },
      include: {
        qr_settings: true,
      },
    })
    .then((user) => {
      console.log("User Updated", user);
      return user;
    })
    .catch((error) => {
      console.log("Error: ", error);
      return error;
    });
  return updateUser;
}

/**
 * Find a user in the database
 * @param {*} username
 * @returns
 */
app.post("/user-data", (req, resp) => {
  const payload = req.body;
  console.log("User Data", payload);
  console.log("Data Fetch: ", payload.data_fetch);
  // resp.status(200).end();
  const data = lookupUser(payload.username);
  data
    .then((response) => {
      console.log("/user-data/: User Data", response);
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
          resp.write(JSON.stringify(response.utm_settings));
          resp.status(200).end();
          break;
        case "qr_settings":
          console.log("QR Settings", response.qr_settings);
          resp.write(JSON.stringify(response.qr_settings));
          resp.status(200).end();
          break;
        default:
          resp.write(JSON.stringify(response));
          resp.status(200).end();
          break;
      }
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
app.post("/update-main-settings", (req, resp) => {
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
 * Update bitly settings in database
 * @param {*} payload
 */
app.post("/update-bitly-settings", (req, resp) => {
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
app.post("/update-utm-settings", (req, resp) => {
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
app.post("/update-qr-settings", (req, resp) => {
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
/**
 * Create a user in the database
 * @param {*} payload
 * @returns
 * @throws
 */
app.post("/create-user", (request, response) => {
  const payload = request.body;
  console.log("Create User", payload);
  response.status(200).end();
  addUserToDatabase(payload)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
});

const emailCustomerAboutFailedPayment = (session) => {
  // TODO: fill me in
  console.log("Emailing customer", session);
};

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

          gatherCustomerData(session);
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

console.log(`Server running at http://localhost:4242/`);
console.log(`Stripe Webhook Secret: ${endpointSecret}`);
console.log(`Stripe Secret Key: ${stripe.key}`);
console.log(`Keygen ID: ${KEYGEN_ACCOUNT_ID}`);
console.log(`Keygen Product Token: ${KEYGEN_PRODUCT_TOKEN}`);
app.listen(4242, () => console.log("Running on port 4242"));
