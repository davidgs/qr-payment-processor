import { PrismaClient } from "@prisma/client";
const login = "elmer_fudd";
const prisma = new PrismaClient();
import Userfront from "@userfront/core";
Userfront.init("xbp876mb");

const foo = Userfront.user.userId
console.log(foo);
async function main() {
const user = await prisma.user.findUnique({
  where: {
    login: login
  },
})
console.log(user);
  // const newUser = await prisma.user.create({
  //   data: {
  //     login: login,
  //     stripe_id: "",
  //     first_name: "Elmer",
  //     last_name: "Fudd",
  //     address: "1 Wabbit Circle",
  //     city: "Looney Tunes",
  //     state: "CA",
  //     zip: "94101",
  //     email: "elmer@fudd.com",
  //     active: false,
  //     confirmed: true,
  //     created_at: new Date(),
  //     licensing: {
  //       create: {
  //         cust_id: "foo-bar-fudd-wabbit-fucker",
  //         active: false,
  //         confirmed: true,
  //         license_key: "it-is-not-wabbit-season",
  //         license_type: "hunting",
  //         expire_date: new Date(),
  //       },
  //     },
  //     main_settings: {
  //       create: {
  //         brand_image: "",
  //         brand_height: 200,
  //         brand_width: 200,
  //         brand_opacity: 1.0,
  //         form_type: "simple",
  //       },
  //     },
  //     bitly_settings: {
  //       create: {
  //         use_value: false,
  //         label: "Shorten Link",
  //         aria_label: "Shorten Link with Bitly",
  //         tooltip: "Shorten Link with Bitly",
  //         error: "No Bitly Token Found",
  //         bitly_token: "",
  //         bitly_domain: "",
  //         bitly_addr: "https://api-ssl.bitly.com/v4/shorten",
  //         bitly_enabled: false,
  //         type: "bitly",
  //       },
  //     },
  //     utm_campaign: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "Campaign",
  //         tooltip: "Enter a campaign name",
  //         error: "Please enter a valid campaign name",
  //         aria_label: "Campaign Name",
  //         value: [],
  //       },
  //     },
  //     utm_keyword: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "Keywords",
  //         tooltip: "Additional keywords to append to the link",
  //         error: "Please enter a valid Keyword",
  //         aria_label: "Add any additional keywords",
  //         value: [],
  //       },
  //     },
  //     utm_content: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "Content",
  //         tooltip: "Additional content to append to the link",
  //         error: "Please enter a valid content value",
  //         aria_label: "Add any additional content",
  //         value: [],
  //       },
  //     },
  //     utm_medium: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "Referral Medium",
  //         tooltip:
  //           "What kind of referral link is this? This is usually how you're distributing the link.",
  //         error: "Please choose a valid referral medium",
  //         aria_label: "Referral medium",
  //         value: [
  //           { key: "cpc", value: "Cost Per Click" },
  //           { key: "direct", value: "Direct" },
  //           { key: "display", value: "Display" },
  //           { key: "email", value: "Email" },
  //           { key: "event", value: "Event" },
  //           { key: "organic", value: "Organic" },
  //           { key: "paid-search", value: "Paid Search" },
  //           { key: "paid-social", value: "Paid Social" },
  //           { key: "qr", value: "QR Code" },
  //           { key: "referral", value: "Referral" },
  //           { key: "retargeting", value: "Retargeting" },
  //           { key: "social", value: "Social" },
  //           { key: "ppc", value: "Pay Per Click" },
  //           { key: "linq", value: "Linq" },
  //         ],
  //       },
  //     },
  //     utm_source: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "Referral Source",
  //         tooltip: "Where will you be posting this link?",
  //         error: "Please enter a valid referral source",
  //         aria_label: "Referral Source",
  //         value: [],
  //       },
  //     },
  //     utm_target: {
  //       create: {
  //         use_value: true,
  //         is_chooser: false,
  //         show_name: true,
  //         label: "URL to encode",
  //         tooltip: "Complete URL to encode",
  //         error: "Please enter a valid URL",
  //         aria_label: "This must be a valid URL",
  //         value: [],
  //       },
  //     },
  //   },
  //   // send email with username/password and license key
  // });
  // console.log("User Created", user);
}
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
            value: "elmer_fudd"
          }
        ]
      }
    ]
  }
};

const response = await fetch(
  "https://api.userfront.com/v0/tenants/xbp876mb/users/find",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer uf_test_admin_xbp876mb_1ff44b31e3c9c0fd2bd50330641cb907",
    },
    body: JSON.stringify(payload),
  }
)
  .then(response => response.json())
  .then(data => {
    console.log("Got: ", data);
    if(data.totalCount === 0) {
      console.log("No user found");
    } else if (data.totalCount > 1) {
      console.log("More than one user found");
    } else {
      console.log("User found: ", data.results[0]);
    }
  })
  .catch(error => console.log("Error: ", error));
//


// main()
//   .then(async () => {
//     await prisma.$disconnect();
//   })
//   .catch(async (e) => {
//     console.error(e);
//     await prisma.$disconnect();
//     process.exit(1);
//   });
