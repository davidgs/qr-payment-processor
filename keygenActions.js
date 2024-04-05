
const KEYGEN_TOKEN = process.env.KEYGEN_TOKEN;

/**
 * assign a machine to a license in Keygen
 * @param {*} payload
 * @returns
 */
export async function getMachine(payload) {
  console.log(`Payload: ${payload}`);
  const match_resp = await fetch(
    `https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/machines/${payload.id}`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: "Bearer <token>",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Machine found", data);
      return data;
    })
    .catch((error) => {
      console.error("Error finding machine", error);
      return error;
    });
  console.log("Machine found", match_resp);
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
            platform: `${payload.platform}`,
            name: `${payload.name}`,
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
  );

  const { data, errors } = await response.json();
  if (errors) {
    console.error(errors);
    throw new Error("Error creating machine");
  }
  console.log(data);
  return data;
}

/**
 * Update a license in Keygen
 * @param {*} payload
 * @returns
 */
export async function updateLicense(payload) {
  const response = await fetch(`https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${payload.id}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/vnd.api+json",
    Accept: "application/vnd.api+json",
    Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
  },
  body: JSON.stringify({
    "data": {
      "type": "licenses",
      "attributes": {
        "expiry": payload.expiry,
      }
    }
  })
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("License updated", data);
      return data;
    })
    .catch((error) => {
      console.error("Error updating license", error);
      return error;
    });
  return response;
}

/**
 * Delete a keygen license
 * @param {} payload
 * @returns
 */
export async function deleteLicense(payload) {
  console.log("Deleting license", payload.id);
  const response = await fetch(`https://api.keygen.sh/v1/accounts/${process.env.KEYGEN_ACCOUNT_ID}/licenses/${payload.id}`, {
  method: "DELETE",
  headers: {
    "Content-Type": "application/vnd.api+json",
    Accept: "application/vnd.api+json",
    Authorization: `Bearer ${process.env.KEYGEN_PRODUCT_TOKEN}`,
  },
  })
    .then((response) => response)
    .then((data) => {
      console.log("License deleted", data);
      return data;
    })
    .catch((error) => {
      console.error("Error deleting license", error);
      return error;
    });
  console.log("License deleted", response);
  return response;
}
