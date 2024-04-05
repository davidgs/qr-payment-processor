import axios from "axios";

// interface EmailData {
//   username: string;
//   customer: string;
//   customer_details: {
//     email: string;
//     name: string;
//     address: {
//       line_1: string;
//       line_2: string;
//       city: string;
//       state: string;
//       postal_code: string;
//     },
//   },
//   lic_key: string;
//   prod_type: string;
//   expire_date: string;
// };
export async function emailAccountDetails(payload) {
  return sendWelcomeMail(payload);
}

export async function sendSubDeletedEmail(payload) {
  return sendCancellationMail(payload);
}

export async function sendCancellationMail(payload) {
  console.log("Sending email", payload);
  try {
    const response = await axios
      .post("http://localhost:4343/sendCancelMail", payload)
      .then((resp) => {
        console.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        console.error("Error sending email", error);
        return error;
      });
    console.log("Email response: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}
export async function sendWelcomeMail(data) {
  console.log("Sending email", data);
  try {
    const response = await axios
      .post("http://localhost:4343/sendWelcomeMail", data)
      .then((resp) => {
        console.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        console.error("Error sending email", error);
        return error;
      });
    console.log("Email response: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}

export async function sendFailMail(data) {
  console.log("Sending email", data);
  try {
    const response = await axios
      .post("http://localhost:4343/sendFailMail", data)
      .then((resp) => {
        console.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        console.error("Error sending email", error);
        return error;
      });
    console.log("Email response: ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}
