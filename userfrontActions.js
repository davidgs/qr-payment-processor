import axios from "axios";
import Userfront from "@userfront/core";
const USERFRONT_TOKEN = process.env.USERFRONT_TOKEN;
const USERFRONT_TENANT = process.env.USERFRONT_TENANT;

/**
 * generate a random 10-character password string
 * @returns
 */
function generatePass() {
  let pass = "";
  const str =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
    "abcdefghijklmnopqrstuvwxyz0123456789@#$-_&*!%?";
  for (let i = 1; i <= 8; i++) {
    pass += str.charAt(Math.floor(Math.random() * str.length + 1));
  }
  return pass;
}

/**
 * Create a new user in Userfront.
 * @param {*} payload
 * @returns
 */
async function createUserfrontUser(payload) {
  console.log("Creating Userfront User", payload);
  if (!payload.password) {
    payload.password = generatePass();
  }
  Userfront.init(USERFRONT_TENANT);
  const u = await Userfront.signup({
    method: "password",
    email: payload.email,
    password: payload.password,
    username: payload.name.replace(" ", "_").toLowerCase(),
    name: payload.name,
    // redirect: "/custom-path"
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error("Error creating Userfront User", error);
      return error;
    });
  console.log("Userfront User Created", u);
  u.password = payload.password;
  return u;
}

/**
 * Find a user in Userfront.
 * @param {*} payload
 * @returns
 */
async function findUserfrontUser(payload) {
  console.log("Finding Userfront User", payload);
  const data = {
    order: "lastActiveAt_ASC",
    page: 1,
    filters: {
      conjunction: "and",
      filterGroups: [
        {
          conjunction: "or",
          filters: [
            {
              attr: "username",
              type: "string",
              comparison: "is",
              value: payload.username,
            },
            {
              attr: "email",
              type: "string",
              comparison: "is",
              value: payload.email,
            },
          ],
        },
      ],
    },
  };
  const r = await axios.post(
    `https://api.userfront.com/v0/tenants/${USERFRONT_TENANT}/users/find`, JSON.stringify(data),
    {
      // method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${USERFRONT_TOKEN}`,
      },
      // body: JSON.stringify(payload),
    })
    .then((response) => {
      console.log("Userfront User response", response);
      return response;
    })
    .catch((error) => {
      console.error("Error finding Userfront User", error);
      return error;
    });
  console.log("Userfront User response", r);
  return r.data;
}

export { findUserfrontUser, createUserfrontUser };
