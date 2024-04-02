
const KEYGEN_TOKEN = process.env.KEYGEN_TOKEN;

export async function getMachine(payload) {
  console.log(`Payload: ${payload}`);
  /*
  username: userfront.username,
          license: license.settings.license_key,
          id: license.settings.cust_id,
          fingerprint: dud.deviceUUID,
          platform: dud.os,
          name: dud.platform,
          */
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