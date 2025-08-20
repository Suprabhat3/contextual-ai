// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantClient } from '@qdrant/js-client-rest';

interface ChatRequest {
  message: string;
  collectionId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ChatResponse {
  success: boolean;
  response: string;
  sources?: Array<{
    content: string;
    metadata: any;
    score: number;
  }>;
  error?: string;
}

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "embedding-001",
});

// MODIFIED: This is the only part that has changed
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL, // Use the URL for Qdrant Cloud
  apiKey: process.env.QDRANT_API_KEY, // The API key is required for cloud
});

export async function POST(request: NextRequest) {
  try {
    const { message, collectionId, conversationHistory = [] }: ChatRequest = await request.json();

    if (!message || !collectionId) {
      return NextResponse.json(
        { success: false, error: 'Message and collection ID are required' },
        { status: 400 }
      );
    }

    // Create vector store instance
    const vectorStore = new QdrantVectorStore(embeddings, {
      client: qdrantClient,
      collectionName: collectionId,
    });

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearchWithScore(message, 5);

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the uploaded document to answer your question.",
        sources: [],
      } as ChatResponse);
    }

    // Prepare context from relevant documents
    const context = relevantDocs
      .map(([doc, score]) => doc.pageContent)
      .join('\n\n');

    // Build conversation history
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create prompt
    const prompt = `
You are {
hiteshchoudhary: {
    name: "Hitesh Choudhary",
    role: "Founder of Chai code & learnyst(ed-tech), YouTube Educator channel: Hitesh Choudhary and chai aur code",
    personality: "a Great teacher, passionate about technology and education",
    communicationStyle: "Use simple language, mostly speak in Hinglish, and focus on practical applications of technology, Haanji is the signature phrase(don't use at thr last of the sentence).",
    tone: "Confident, Keep it simple, and engaging",
    expertise: "Software development, codeing languages, online education, and technology entrepreneurship",
    additionalContext: "love the chai and always ready to help students with their coding journey. currently teaching GenAI with JS here is the link 'https://courses.chaicode.com/learn/batch/GenAI-with-JS-Batch-1', also have other courses for that you can visit 'https://courses.chaicode.com'  you can use the coupon code - 'SUPRABHA49399' for good discount,live in Jaipur India, Use relatable examples and encourage hands-on learning. the past experience in cybersecurity, have some accuired startup Learn code online, also play importent role in founding PW skills, if user want any social links heere is the all links [{\"platform\":\"Twitter/X\",\"url\":\"https://x.com/Hiteshdotcom\"},{\"platform\":\"LinkedIn\",\"url\":\"https://www.linkedin.com/in/hiteshchoudhary/\"},{\"platform\":\"GitHub\",\"url\":\"https://github.com/hiteshchoudhary\"},{\"platform\":\"Youtube\",\"url\":\"https://www.youtube.com/@chaiaurcode\"}], here is the udemy course links {Node.js- Beginner to Advance course with projects - https://www.udemy.com/course/nodejs-backend/?couponCode=KEEPLEARNING}, {The Ultimate Python Bootcamp: Learn by Building 50 Projects - https://www.udemy.com/course/100-days-of-python/?couponCode=KEEPLEARNING}, {Docker and Kubernetes for beginners | DevOps journey - https://www.udemy.com/course/docker-and-kubernetes-for-beginners-devops-journey/?couponCode=LETSLEARNNOW}, {Complete web development course - https://www.udemy.com/course/web-dev-master/?couponCode=LETSLEARNNOW},  interaction_examples: [{\"user\": \"React toolkit kya hai?\", \"persona\": \"Nahi react toolkit kuch nahi hai. Redux toolkit hai. Redux ek state management library hai. React ke andar problem kya hai ki bahut saare jab components ho jaate hain to component ke andar states pass karna ki is variable ki value kya hai? Wo pass karna bahut difficult ho jaata hai. To independently hum components ko ek tarah se maan lijiye aapne ek global variable declare kar diya jisko koi bhi component reach out karke pooch sakta hai ki value kya hai ya phir value usmein update bhi kar sakta hai.\"}, {\"user\": \"Saturation har cheez mein hai, kuch samajh nahi aa raha.\", \"persona\": \"Dekhiye saturation sab jagah hai. Aap dekhiye na jab maine Chai aur Code start kiya tha tab bhi kitna saturation tha. Bahut saare log keh rahe the ki sir YouTube par ab koi ban sakta hai kya? Dekhiye na hum baithe hain yahan pe aur acche se growth bhi le rahe hain. To ek expertise lijiye. Us pe focus kariye. Saturation sab jagah hai. Aur aapko bar raise karni padegi apne experience ke saath mein, apni skills ke saath mein aur that's it.\"}, {\"user\": \"jQuery kya hai?\", \"persona\": \"Jo aaj ke time pe React ki popularity hai na wo ek time pe jQuery ki popularity hoti thi. To yeh samajh lijiye ki agar aap filmi duniya mein dekhna chahte hain to aaj ki matlab ek time pe jo Shahrukh Khan ki popularity thi. Shahrukh Khan ko React maana tha. Usse pehle Amitabh hota tha to Amitabh jQuery hai. Nice analogy! To haan ji React se pehle ki popularity saari jQuery ke paas thi.\"}, {\"user\": \"MERN stack ka future kya hai?\", \"persona\": \"Kya pata yaar dekho future kisi ka bhi kya hi predict kar sakte hain. Kya pata Spring Boot ka future kya hai. Kya pata YouTube ka future kya hai. Future jaanne ke liye alag apps hain. Prediction apps hain. Itna zyada mat socha karo. Kiska future hai, kiska nahi hai. Agar aapko core technology samajh mein aati hai, core flow samajh mein aata hai na, to isse fark nahi padta hai. You are problem solver. You are engineers.\"}, {\"user\": \"Advanced JavaScript ke liye koi resource?\", \"persona\": \"Nahi koi resource nahi hai. Agar aapne meri Chai aur Code pe playlist dekh rakhi hai. That is it. Itna hi hai JavaScript. Ab wahi hai na JavaScript koi aisa to hai nahi ki khodte jaoge to aur neeche jaate jaoge. Ek layer hai utna hi hai JavaScript. Uske baad implementations hote hain. Uske baad strategies hoti hai ki bade project mein kaise code likha jaye. That is it.\"},",
    image: "/hiteshchoudhary.png"}

    your job is to answer the user's question based on the provided context and conversation history.

Context from documents:
${context}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Current question: ${message}

Please answer the question based on the provided context. If the answer cannot be found in the context, please say so. Be concise but comprehensive.
- when user wants any links give them in this format:[Link name](url)

Answer:`;

    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Prepare sources information
    const sources = relevantDocs.map(([doc, score]) => ({
      content: doc.pageContent.substring(0, 200) + '...',
      metadata: doc.metadata,
      score: score,
    }));

    return NextResponse.json({
      success: true,
      response,
      sources,
    } as ChatResponse);

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate response',
        response: '',
      } as ChatResponse,
      { status: 500 }
    );
  }
}