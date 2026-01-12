"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendOTP = action({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (_, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error("Twilio credentials not configured");
    }

    const phone = args.phoneNumber.startsWith("+") 
      ? args.phoneNumber 
      : `+2${args.phoneNumber}`;

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: phone,
          Channel: "sms",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send OTP");
    }

    const data = await response.json();
    return { status: data.status, to: data.to };
  },
});

export const verifyOTP = action({
  args: {
    phoneNumber: v.string(),
    code: v.string(),
  },
  handler: async (_, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error("Twilio credentials not configured");
    }

    const phone = args.phoneNumber.startsWith("+") 
      ? args.phoneNumber 
      : `+2${args.phoneNumber}`;

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: phone,
          Code: args.code,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Verification failed");
    }

    const data = await response.json();
    
    if (data.status === "approved") {
      return { success: true, phone: data.to };
    } else {
      return { success: false, status: data.status };
    }
  },
});
