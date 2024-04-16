// Description: This file contains the actions for the Keygen API
const KEYGEN_TOKEN = process.env.KEYGEN_TOKEN;
const KEYGEN_ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID;

/*
payload = {
  name: string;
  fingerprint: string;
  platform: string;
  license: string;
}
*/
/**
 * Add a license to a user
 * @param {*} payload = {
      username: user.login,
      license: licenseKey,
      fingerprint: fingerprint,
      os: os,
      platform: platform,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      id: license.settings.cust_id,
    }
 * @returns
 */

export async function addLicense(payload, logger) {
  const returnPayload = {
    user: "",
    license: "",
    machine: "",
    cust_id: "",
    status: "",
    policy: "",
  };
  // lookup the user
  let user = "";
  if (payload.id !== "") {
    user = payload.id;
  } else {
    user = payload.email;
  }
  let keygenUserFound = false;
  /* look up keygen user by email */
  const u = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/users/${user}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      keygenUserFound = true;
      return data;
    })
    .catch((error) => {
      logger.error("Error finding account", error);
      return error;
    });
  /* if the user is not found, create a new user */
  if (u.errors) {
    logger.error(u.errors);
    // create a user
    const nu = await createKeygenAccount(payload, logger)
      .then((data) => {
        return data;
      })
      .catch((error) => {
        logger.error("Error creating account", error);
        return error;
      });
    returnPayload.cust_id = nu.data.id;
    /*
    {"data":{"id":"7e6f25f3-a7db-44f0-981e-9dbd69e5e19e","type":"users","attributes":{"fullName":"Daffy Duck","firstName":"Daffy","lastName":"Duck","email":"daffy@davidgs.com","status":"ACTIVE","role":"user","metadata":{},"created":"2024-04-09T18:03:39.934Z","updated":"2024-04-09T18:03:39.934Z"},},}
    */
  } else {
    returnPayload.cust_id = u.data.id;
  }
  /* we've now got the user straightened out, let's get the license */
  const l = await getLicense(payload, logger)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error finding license", error);
      return error;
    });
  if (l.errors) {
    logger.error(l.errors);
  }
  /* license is found, so we store the id */
  const licID = l.data.id;
  /* now we assign the license to the user */
  const assLic = await assignLicense(licID, returnPayload.cust_id, logger)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error assigning license", error);
      return error;
    });
  logger.log("License assigned", assLic);
  /* validate the license -- probably unessesary */
  const valLic = await validateLicense(payload, logger)
    .then((data) => {
      logger.log("License validated", data);
      return data;
    })
    .catch((error) => {
      logger.error("Error validating license", error);
      return error;
    });
  logger.log("License validated", valLic);
  returnPayload.status = valLic.data.attributes.status;
  returnPayload.policy = valLic.data.relationships.policy.data.id;
  /* activate the machine */
  payload.license_id = licID;
  const actMach = await activateMachine(payload, logger)
    .then((data) => {
      logger.log("Machine activated", data);
      return data;
    })
    .catch((error) => {
      logger.error("Error activating machine", error);
      return error;
    });
  logger.log("Machine activated", actMach);
  if (actMach.errors) {
    logger.error(actMach.errors);
  }
  return returnPayload;
}

/**
 * Assign a license to a user in Keygen
 * @param {*} licenseID
 * @param {*} cust_id
 * @returns
 */
async function assignLicense(licenseID, cust_id, logger) {
  const l = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${licenseID}/user`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          type: "users",
          id: cust_id,
        },
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error assigning license", error);
      return error;
    });
  return l;
}

/**
 * Get a license from Keygen
 * @param {*} payload
 * @returns
 */
async function getLicense(payload, logger) {
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${payload.license}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error finding license", error);
      return error;
    });
  return response;
}
/**
 * Create a keygen account ...
 * @param {*} payload = {
      username: user.login,
      license: licenseKey,
      fingerprint: fingerprint,
      os: os,
      platform: platform,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      id: license.settings.cust_id,
    }
 * @returns
 *
 */
export async function createKeygenAccount(payload, logger) {
  const response = await fetch(`https://api.keygen.sh/v1/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        type: "accounts",
        attributes: {
          firstName: `${
            payload.name.split(" ")[0].charAt(0).toUpperCase() +
            payload.name.split[0].slice(1)
          }`,
          lastName: `${
            payload.name.split(" ")[1].charAt(0).toUpperCase() +
            payload.name.split[1].slice(1)
          }`,
          email: payload.email,
        },
      },
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error creating account", error);
      return error;
    });
  return response;
}

/**
 * Given a license token, list all the machines
 * @param {*} license
 * @returns {data, errors}
 */
export async function listMachinesForLicense(license, logger) {
  const req = new Request(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/machines`,
    {
      method: "GET",
      headers: {
        Authorization: `License ${license}`,
        Accept: "application/json",
      },
    }
  );

  const res = await fetch(req)
    .then((response) => response.json())
    .then((data) => {
      return data;
    }
  )
    .catch((error) => {
      logger.error("Error finding machines", error);
      return error;
    }
  );
  return res;
}
/**
 *
 * @param {*} payload = {
      username: user.login,
      license: licenseKey,
      fingerprint: fingerprint,
      os: os,
      platform: platform,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      id: license.settings.cust_id,
    }
 * @returns
 */
export async function validateLicense(payload, logger) {
  const validation = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
      body: JSON.stringify({
        meta: {
          key: payload.license,
          scope: {
            fingerprint: payload.fingerprint,
          },
        },
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      logger.log("License Status: ", data.meta.detail);
      return data;
    })
    .catch((error) => {
      logger.error("Error validating license", error);
      return error;
    });
  return validation;
}

async function getNewMachine(payload, logger) {
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/machines`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          type: "machines",
          attributes: {
            fingerprint: `${payload.fingerprint}`,
            platform: `${payload.name}`,
            name: `${payload.username}-${payload.platform
              .toLowerCase()
              .replace(" ", "-")}`,
          },
          relationships: {
            license: {
              data: {
                type: "licenses",
                id: `${payload.license_id}`,
              },
            },
          },
        },
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error creating machine", error);
      return error;
    });
  return response;
}

export async function activateMachine(payload, logger) {
  const fingerprint = payload.fingerprint;
  // license is active
  const machine = await getNewMachine(payload, logger)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error creating machine", error);
      return error;
    });
  if (machine.errors) {
    logger.log(machine.errors);
    return new Error("Error creating machine");
  }
  return machine;
}

/**
 * assign a machine to a license in Keygen
 * @param {*} payload
 * @returns
 */
export async function getMachine(payload, logger) {
  const match_resp = await fetch(
    `https://api.keygen.sh/v1/accounts/${
      process.env.KEYGEN_ACCOUNT_ID
    }/machines/${encodeURIComponent(payload.fingerprint)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error finding machine", error);
      return error;
    });
  logger.log("Machine found", match_resp);
  if (match_resp.errors) {
    if (match_resp.errors[0].code === "NOT_FOUND") {
      const machine = await fetch(
        `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/machines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
          },
          body: JSON.stringify({
            data: {
              type: "machines",
              attributes: {
                fingerprint: `${payload.fingerprint}`,
                platform: `${payload.platform}`,
                name: `${payload.username}-${payload.name}`,
              },
              relationships: {
                license: {
                  data: {
                    type: "licenses",
                    id: `${payload.id}`,
                  },
                },
              },
            },
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          return data;
        })
        .catch((error) => {
          logger.error("Error creating machine", error);
          return error;
        });
      if (machine.errors) {
        return new Error("Error creating machine");
      } else {
        return machine;
      }
    }
    return new Error("Error finding machine");
  }
  if (match_resp.errors) {
    logger.error(errors);
    return new Error("Error creating machine");
  }
  return match_resp;
}

async function retrieveMachine(id, key, logger) {
  const retrieval = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines/${encodeURIComponent(
      id
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
        Accept: "application/vnd.api+json",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error finding machine", error);
      return error;
    });
  return machine;
}
/**
 * Update a license in Keygen
 * @param {*} payload
 * @returns
 */
export async function updateLicense(payload, logger) {
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${payload.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          type: "licenses",
          attributes: {
            expiry: payload.expiry,
          },
        },
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error updating license", error);
      return error;
    });
  return response;
}

/**
 * Delete a keygen license
 * @param {} payload
 * @returns
 */
export async function deleteLicense(payload, logger) {
  logger.log("Deleting license", payload.id);
  const response = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${payload.id}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
      },
    }
  )
    .then((response) => response)
    .then((data) => {
      return data;
    })
    .catch((error) => {
      logger.error("Error deleting license", error);
      return error;
    });
  return response;
}
