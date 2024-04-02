import nodemailer from "nodemailer";
import { SMTPClient } from "smtp-client";
import axios from "axios";

export async function emailAccountDetails(payload) {

  return sendMail(payload);
}
export async function sendMail(data) {

  console.log("Sending email", data);
  try {
    const response = await axios
      .post("http://localhost:4343/sendMail", data)
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
    console.error("Error generating license:", error.message);
    throw new Error("License Generation Failed");
  }
}
