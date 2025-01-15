import { OpenAI } from "openai";

// Initialize OpenAI client with API key
export const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Function to send user messages to OpenAI for processing
export const getAIResponse = async (message: string) => {
  try {
    const response = await openAI.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
            You are a customer service agent for a fast food restaurant.
            - If a user mentions needing recommendations, respond with the appropriate action prefixed with "recommend".
            - Menu items are typical McDonald's options.
            - Available actions are:
              - recommend:createOrder -> Create an order.
              - recommend:updateOrder -> Update an order.
              - recommend:finalizeOrder -> Mark the order as 'completed'.
              - recommend:checkStatus -> Check the status of the latest order.
              - recommend:refund -> Mark the order as 'canceled'.
              - recommend:search -> Search for menu items
            - On 'create' and 'update' actions, split each item with a comma.
            For example:
            - User: "I want a Big Mac and large fries."
            - AI: "recommend:createOrder Big Mac, Large Fries"
            Another example:
            - User: "I want something spicy"
            - AI: "recommend:search spicy"
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const aiResponse = response.choices[0].message?.content;

    if (!aiResponse) {
      throw new Error("No response received from AI");
    }

    // Parse the AI response to extract the action and content
    const actionMatch = aiResponse.match(/^recommend:\w+/);
    const action = actionMatch ? actionMatch[0] : null;
    const content = aiResponse.replace(/^recommend:\w+\s*/, "").trim();

    return { action, content };
  } catch (error: any) {
    console.error("Error getting AI response:", error.message || error);
    return {
      action: null,
      content:
        "I'm sorry, but I couldn't process your request. Please try again.",
    };
  }
};

export const searchEmbedding = async (items: string) => {
  try {
    // Generate embedding for the query
    const embeddingResponse = await openAI.embeddings.create({
      model: "text-embedding-ada-002",
      input: items,
    });

    return embeddingResponse.data[0].embedding;
  } catch (error: any) {
    console.error("Error getting AI response:", error.message || error);
    return {
      action: null,
      content:
        "I'm sorry, but I couldn't process your request. Please try again.",
    };
  }
};
