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
async function createUserfrontUser(payload, logger) {
  if (!payload.password) {
    payload.password = generatePass();
  }
  const pl = {
    email: payload.email,
    username: payload.name.replace(" ", "_").toLowerCase(),
    name: payload.name,
    password: payload.password,
  };
  console.log("pl", pl);
  // const p = {
  //   method: "password",
  //   email: payload.email,
  //   password: payload.password,
  //   username: payload.name.replace(" ", "_").toLowerCase(),
  //   name: payload.name,
  //   redirect: "/custom-path",
  // };
  const r = await fetch(
    `https://api.userfront.com/v0/tenants/${USERFRONT_TENANT}/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${USERFRONT_TOKEN}`,
      },
      body: JSON.stringify(pl),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      logger.log("Userfront User created", data);
      return data;
    })
    .catch((error) => {
      logger.error("Error creating Userfront User", error);
      return error;
    });
  r.password = payload.password;
  return r;
}

/**
 * Find a user in Userfront.
 * @param {*} payload
 * @returns
 */
async function findUserfrontUser(payload, logger) {
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
  // const f = await fetch(
  //   `https://api.userfront.com/v0/tenants/${USERFRONT_TENANT}/users/find`,
  //   {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${USERFRONT_TOKEN}`,
  //     },
  //     body: JSON.stringify(data),
  //   }
  // )
  //   .then((response) => {
  //     return response.json();
  //   })
  //   .catch((error) => {
  //     logger.error("Error finding Userfront User", error);
  //     return error;
  //   });
  const r = await axios
    .post(
      `https://api.userfront.com/v0/tenants/${USERFRONT_TENANT}/users/find`,
      JSON.stringify(data),
      {
        // method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${USERFRONT_TOKEN}`,
        },
        // body: JSON.stringify(payload),
      }
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      logger.error("Error finding Userfront User", error);
      return error;
    });
  logger.log("Userfront User found", r.data);
  return r.data;
}

export { findUserfrontUser, createUserfrontUser };
