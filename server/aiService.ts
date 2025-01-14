import { OpenAI } from "openai";

// Initialize OpenAI client with API key
export const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Function to send user messages to OpenAI for processing
export const getAIResponse = async (message: string) => {
  try {
    const response = await openAI.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a customer service agent for a fast food restaurant. If a user mentions needing recommendations, respond with 'recommend' followed by the  suggestions action, like recommend:createOrder.",
        },
        {
          role: "system",
          content: "the menu items are the same we can find at mcdonalds",
        },
        {
          role: "system",
          content: `
            These are the options:
            recommend:createOrder -> Create a order
            recommend:UpdateOrder -> Update a order
            recommend:finalizeOrder -> update order to status status 'completed'
            recommend:checkStatus -> check status for latest order
            recommend:refund -> update order to status 'canceled'

            on create and update order, we should split each item with ','

            for instance you should respond 'recommend:createOrder big mac, large fries'
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return response.choices[0].message?.content;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "Sorry, I couldn't process your request at the moment.";
  }
};
