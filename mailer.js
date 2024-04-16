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
export async function emailAccountDetails(payload, logger) {
  return sendWelcomeMail(payload, logger);
}

export async function sendSubDeletedEmail(payload, logger) {
  return sendCancellationMail(payload, logger);
}

export async function sendCancellationMail(payload, logger) {
  try {
    const response = await axios
      .post("http://localhost:4343/sendCancelMail", payload)
      .then((resp) => {
        logger.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        logger.error("Error sending email", error);
        return error;
      });
    return response.data;
  } catch (error) {
    logger.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}
export async function sendWelcomeMail(data, logger) {
  logger.log("Sending email", data);
  try {
    const response = await axios
      .post("http://localhost:4343/sendWelcomeMail", data)
      .then((resp) => {
        logger.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        logger.error("Error sending email", error);
        return error;
      });
    return response.data;
  } catch (error) {
    logger.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}

export async function sendFailMail(data, logger) {
  try {
    const response = await axios
      .post("http://localhost:4343/sendFailMail", data)
      .then((resp) => {
        logger.log("Email sent", resp.data);
        return resp;
      })
      .catch((error) => {
        logger.error("Error sending email", error);
        return error;
      });
    return response.data;
  } catch (error) {
    logger.error("Error generating Email:", error.message);
    throw new Error("Email Generation Failed");
  }
}
