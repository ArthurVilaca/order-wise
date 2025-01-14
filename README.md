# OrderWise: AI-Powered Customer Service for Fast Food Chains

OrderWise is a real-time chat-based application that enables users to interact with an AI customer service representative. It simplifies meal ordering, status tracking, refund handling, and menu recommendations via a seamless conversational experience.

## Key Technical, Product, and UX Decisions

### Technical Decisions
1. **Socket.IO for Real-Time Communication**:
   - Enables instantaneous message exchanges and order updates between users and the AI agent.

2. **LLM Integration for AI Responses**:
   - Powered by OpenAI (or another LLM provider) for interpreting user messages and generating natural language responses.
   - Structured responses are used for backend actions (e.g., `recommend:createOrder`).

3. **Embedding-Based Recommendations**:
   - Uses vector similarity search to recommend menu items based on user preferences (e.g., "I want something spicy").

4. **PostgreSQL for Data Persistence**:
   - Tracks users, orders, conversation logs, and AI actions for analytics and accountability.

5. **State Management for Conversations**:
   - Context tracking ensures smooth multi-step conversational flows, such as order placement and refund handling.

6. **Modular Action Handlers**:
   - Functions like `createOrder`, `updateOrder`, and `finalizeOrder` are implemented as reusable handlers triggered by specific AI intents.

### Product Decisions
1. **Multi-Step Conversational Flow**:
   - Designed to guide users through a natural order lifecycle with minimal friction.

2. **Clear Prompts and Confirmation**:
   - Ensures users understand AI responses and next steps, reducing confusion during interactions.

3. **Recommendations with Contextual Relevance**:
   - Embedding-based suggestions cater to dietary preferences and specific queries.

### UX Decisions
1. **Real-Time Feedback**:
   - WebSocket updates provide immediate responses for actions like order creation or status changes.

2. **Error-Handling Messages**:
   - Informative fallback messages help users correct input errors or clarify ambiguous requests.

3. **Seamless Role Differentiation**:
   - Chat history clearly labels messages as coming from the user or the AI agent.

---

## Risks, Unknowns, or Technical/Product Questions

### Risks
1. **AI Misinterpretation**:
   - The AI may misclassify user intents, leading to incorrect actions (e.g., initiating a refund instead of checking status).

2. **Real-Time Load Handling**:
   - High concurrent user loads may impact Socket.IO performance or database query times.

### Unknowns
1. **Recommendation Accuracy**:
   - Effectiveness of embedding-based recommendations depends on the quality and granularity of menu embeddings.

2. **User Edge Cases**:
   - Handling unexpected user queries (e.g., "Can I get a discount?") or invalid input gracefully.

### Questions
1. **AI Fine-Tuning**:
   - Should the AI model be fine-tuned to better understand fast-food-specific queries?

2. **Refund Policy Integration**:
   - How will the app interface with the company’s existing refund policy and systems?

---

## Setup Steps

### Prerequisites
1. **Node.js** (v16+)
2. **PostgreSQL** (v13+)
3. **Docker** (optional, for containerized setup)
4. API Key for an LLM Provider (e.g., OpenAI)

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/orderwise.git
   cd orderwise
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the project root with the following:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://username:password@localhost:5432/orderwise
   OPENAI_API_KEY=your_openai_api_key
   EMBEDDING_MODEL=text-embedding-ada-002
   ```

4. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev
   ```

5. **Seed the Database** (optional):
   ```bash
   npm run seed
   ```

6. **Start the Server**:
   ```bash
   npm run dev
   ```

7. **Run Frontend** (if applicable):
   Ensure the frontend is configured to connect to the backend WebSocket endpoint.

### Optional: Docker Setup
1. **Build Docker Image**:
   ```bash
   docker build -t orderwise .
   ```

2. **Run Docker Container**:
   ```bash
   docker run -p 3000:3000 --env-file .env orderwise
   ```

---

## Embedding-Based Search Configuration

1. **Embedding Model**:
   - Ensure `EMBEDDING_MODEL` is set in `.env` to a supported embedding model (e.g., `text-embedding-ada-002`).

2. **Embedding Index**:
   - Pre-compute embeddings for menu items and store them in the database.
   ```bash
   npm run generate-embeddings
   ```

3. **Similarity Search**:
   - Use a library like `pgvector` or a standalone vector database (e.g., Pinecone, Weaviate) for fast similarity searches.

---

## Testing

1. **Unit Tests**:
   ```bash
   npm run test
   ```

2. **Integration Tests**:
   ```bash
   npm run test:integration
   ```

3. **Manual Testing**:
   - Simulate multi-step flows via the real-time chat interface.

---

For additional details, refer to the project documentation or contact the maintainer.

