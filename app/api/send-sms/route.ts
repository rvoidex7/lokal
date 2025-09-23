import { NextRequest, NextResponse } from 'next/server';
import Twilio from 'twilio';
import { z } from 'zod';

// Initialize Twilio client with credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = Twilio(accountSid, authToken);

// Define the expected schema for the request body
const sendSmsSchema = z.object({
  to: z.string().min(10, 'A valid phone number is required'), // Basic validation
  body: z.string().min(1, 'Message body cannot be empty'),
});

export async function POST(req: NextRequest) {
  // Check if Twilio credentials are configured
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.error('Twilio credentials are not configured in environment variables.');
    return NextResponse.json({ error: 'Service is not configured.' }, { status: 500 });
  }

  try {
    const json = await req.json();
    
    // Validate the request body
    const validationResult = sendSmsSchema.safeParse(json);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { to, body } = validationResult.data;

    const message = await client.messages.create({
      from: twilioPhoneNumber,
      to,
      body,
    });

    console.log('SMS sent successfully with SID:', message.sid);
    return NextResponse.json({ message: 'SMS sent successfully!', sid: message.sid });

  } catch (error) {
    console.error('An unexpected error occurred while sending SMS:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
