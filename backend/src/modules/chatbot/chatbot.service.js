const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const prisma = require('../../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


//  CACHE SYSTEM
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

//  Normalize message
const normalize = (msg) =>
  msg.toLowerCase().replace(/[^\w\s]/gi, '').trim();

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

const setCache = (key, value) => {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, { value, timestamp: Date.now() });

  if (cache.size >= 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
};

const isGeneralQuestion = (message) => {
  const general = [
    /what is protein|ما هو البروتين/i,
    /what is calorie|ما هي السعرات/i,
    /benefits of water|فوائد الماء/i,
    /what is bmi/i,
    /what is fiber|ما هو الألياف/i,
  ];
  return general.some(pattern => pattern.test(message));
};


//  PROFESSIONAL LOGGER
const log = (event, data = {}) => {
  const icons = {
    start: '🚀',
    gemini: '⚡',
    retry: '🔄',
    ollama: '🦙',
    cache: '📦',
    typing: '✍️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    done: '🏁',
  };

  console.log(JSON.stringify({
    icon: icons[event] || '📌',
    event,
    time: Date.now(),
    ...data
  }));
};


//  INTENT DETECTION
const detectIntent = (message) => {
  const msg = message.toLowerCase();
  if (/weight|poids|وزن|kilo/.test(msg)) return 'progress';
  if (/eat|meal|food|اكل|manger|repas|calories|سعرات/.test(msg)) return 'nutrition';
  if (/plan|diet|خطة|régime/.test(msg)) return 'plan';
  if (/appointment|موعد|consultation|rendez/.test(msg)) return 'appointment';
  return 'general';
};

//  DYNAMIC CONTEXT
const getDynamicContext = async (userId, intent) => {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    include: { user: { select: { fullName: true } } }
  });

  if (!patient) return null;

  let context = `You are NutriBot, a nutrition assistant for KhabirLens.
Reply in same language as patient. Be concise and helpful.
Patient: ${patient.user.fullName}
Weight: ${patient.weight || 'N/A'}kg | Allergies: ${patient.allergies || 'None'}
`;

  if (intent === 'progress') {
    const progress = await prisma.progress.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
      take: 3
    });
    context += `\nWeight history: ${progress.map(p => p.weight + 'kg').join(' → ')}`;
  }

  if (intent === 'nutrition') {
    const food = await prisma.foodLog.findMany({
      where: { patientId: patient.id },
      orderBy: { estimatedAt: 'desc' },
      take: 3
    });
    context += `\nRecent food: ${food.map(f => f.totalCalories + 'cal').join(', ')}`;
  }

  if (intent === 'plan') {
    const plan = await prisma.nutritionPlan.findFirst({
      where: { patientId: patient.id, status: 'ACTIVE' },
      include: {
        meals: { take: 2, include: { foodItems: { take: 2 } } }
      }
    });
    if (plan) {
      context += `\nNutrition plan: ${plan.meals.map(m =>
        `${m.mealType}: ${m.foodItems.map(f => f.name).join(', ')}`
      ).join(' | ')}`;
    }
  }

  if (intent === 'appointment') {
    const appt = await prisma.appointment.findFirst({
      where: { patientId: patient.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      include: { slot: true },
      orderBy: { createdAt: 'desc' }
    });
    if (appt) {
      context += `\nNext appointment: ${new Date(appt.slot.date).toLocaleDateString()} ${appt.slot.startTime} - Status: ${appt.status}`;
    }
  }

  return context;
};


//  GEMINI STREAMING
const callGeminiStream = async (context, history, message) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: {
      role: 'user',
      parts: [{ text: context }]
    }
  });

  const chat = model.startChat({
    history: history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })),
    generationConfig: {
      maxOutputTokens: 800 ,
      temperature: 0.7
    }
  });

  const result = await chat.sendMessageStream(message);
  return result.stream;
};

//  OLLAMA STREAMING
const callOllamaStream = async (context, history, message) => {
  const messages = [
    { role: 'system', content: context },
    ...history.slice(-6),
    { role: 'user', content: message }
  ];

  const response = await axios.post(
    `${process.env.OLLAMA_URL}/api/chat`,
    {
      model: process.env.OLLAMA_MODEL || 'gemma:2b',
      messages,
      stream: true,
      options: {
        temperature: 0.7,
        num_predict: 300,
        num_ctx: 1024,
        num_thread: 8,
      }
    },
    { responseType: 'stream', timeout: 60000 }
  );

  return response.data;
};


//  SAVE TO DB
const saveToDb = async (userId, message, fullResponse, provider, intent, duration) => {
  try {
    //  patientId from userId
    const patient = await prisma.patient.findUnique({
      where: { userId }
    });

    if (!patient) return;

    await prisma.chatbotMessage.create({
      data: {
        patientId: patient.id,
        message,
        response: fullResponse,
        provider,
        intent,
        duration,
      }
    });
  } catch (err) {
    log('error', { message: 'DB save failed', error: err.message });
  }
};


//  SEND TYPING EVENT
const sendTyping = (res) => {
  res.write(`event: typing\ndata: {}\n\n`);
};

//  IS QUOTA ERROR
const isQuotaError = (err) =>
  err.message?.includes('429') ||
  err.message?.includes('quota') ||
  err.message?.includes('Too Many');

const isNetworkError = (err) =>
  err.message?.includes('fetch failed') ||
  err.message?.includes('503') ||
  err.message?.includes('ECONNREFUSED') ||
  err.message?.includes('timeout');

//  MAIN CHAT FUNCTION
const chat = async (userId, message, history = [], res) => {
  const startTime = Date.now();
  const intent = detectIntent(message);

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    res.write(`data: ${JSON.stringify({ error: 'Client profile not found' })}\n\n`);
    res.end();
    return;
  }

const pkg = await getPatientPackage(userId);
  if (!pkg || !pkg.chatbot) {
    res.write(`data: ${JSON.stringify({ error: 'Chatbot not included in your current plan. Upgrade to unlock.' })}\n\n`);
    res.end();
    return;
  }
  
  log('start', { userId, intent, messageLength: message.length });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Typing indicator
  sendTyping(res);
  log('typing', { message: 'Typing event sent' });

  //  Check Cache 
  if (isGeneralQuestion(message)) {
    const cacheKey = normalize(message);
    const cached = getCached(cacheKey);

    if (cached) {
      log('cache', { message: 'Cache hit!' });
      res.write(`data: ${JSON.stringify({ text: cached, provider: 'cache' })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ fullResponse: cached, provider: 'cache' })}\n\n`);
      res.end();
      return;
    }


  }

  //  Get Context
  const context = await getDynamicContext(userId, intent);
  if (!context) {
    res.write(`data: ${JSON.stringify({ error: 'Client not found' })}\n\n`);
    res.end();
    return;
  }

  const trimmedHistory = history.slice(-6);
  let provider;
  let fullResponse = '';


  //  TRY GEMINI (with retry for network errors)
  let geminiSuccess = false;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      provider = 'gemini';
      log('gemini', { status: 'trying', attempt });

      const stream = await callGeminiStream(context, trimmedHistory, message);

      for await (const chunk of stream) {
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ text, provider })}\n\n`);
        }
      }

      geminiSuccess = true;
      log('success', { provider, attempt, duration: Date.now() - startTime });
      break;

    } catch (geminiError) {
      if (isQuotaError(geminiError)) {
        log('warning', { provider: 'gemini', reason: 'quota_exceeded', switching: 'ollama' });
        break;
      }

      //  Network Error → try again
      if (isNetworkError(geminiError) && attempt === 1) {
        log('retry', { provider: 'gemini', reason: 'network_error', attempt: 2 });
        await new Promise(resolve => setTimeout(resolve, 1000)); // ننتظر ثانية
        continue;
      }

      // Another Error → Ollama directly
      log('warning', { provider: 'gemini', reason: geminiError.message, switching: 'ollama' });
      break;
    }
  }


  //  FALLBACK TO OLLAMA
  if (!geminiSuccess) {
    try {
      provider = 'ollama';
      fullResponse = '';
      log('ollama', { status: 'trying' });

      const stream = await callOllamaStream(context, trimmedHistory, message);

      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            const text = data.message?.content;
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ text, provider })}\n\n`);
            }
          } catch (e) {
            continue; // ignore safely
          }
        }
      }

      log('success', { provider, duration: Date.now() - startTime });

    } catch (ollamaError) {
      log('error', { message: 'Both AI services failed', error: ollamaError.message });
      res.write(`data: ${JSON.stringify({ error: 'AI service unavailable. Please try again.' })}\n\n`);
    }
  }

  // Cache General Responses 
  if (isGeneralQuestion(message) && fullResponse) {
    const cacheKey = normalize(message);
    setCache(cacheKey, fullResponse);
    log('cache', { message: 'Response cached', key: cacheKey });
  }

  // Save to DB 
  const duration = Date.now() - startTime;
  await saveToDb(userId, message, fullResponse, provider, intent, duration);

  //  End Stream 
  res.write(`event: done\ndata: ${JSON.stringify({ fullResponse, provider, intent, duration })}\n\n`);
  res.end();

  log('done', { provider, intent, duration });
};

//  Get Patient Chat History 
const getChatHistory = async (userId, page = 1, limit = 20) => {
  const patient = await prisma.patient.findUnique({
    where: { userId }
  });
  if (!patient) throw new Error('Client not found');

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.chatbotMessage.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        message: true,
        response: true,
        provider: true,
        intent: true,
        duration: true,
        createdAt: true,
      }
    }),
    prisma.chatbotMessage.count({
      where: { patientId: patient.id }
    })
  ]);

  const formattedHistory = messages.flatMap(m => [
    { role: 'user', content: m.message, createdAt: m.createdAt },
    { role: 'assistant', content: m.response, provider: m.provider, intent: m.intent, duration: m.duration, createdAt: m.createdAt }
  ]);

  return {
    history: formattedHistory,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    }
  };
};


//  Get Chatbot Statistics (Admin) 
const getChatbotStats = async () => {
  const [
    totalMessages,
    geminiCount,
    ollamaCount,
    cacheCount,
    intentStats,
    avgDuration,
    recentMessages,
    activePatients,
  ] = await Promise.all([

    // Total messages
    prisma.chatbotMessage.count(),

    // Gemini count
    prisma.chatbotMessage.count({
      where: { provider: 'gemini' }
    }),

    // Ollama count
    prisma.chatbotMessage.count({
      where: { provider: 'ollama' }
    }),

    // Cache count
    prisma.chatbotMessage.count({
      where: { provider: 'cache' }
    }),

    // Intent breakdown
    prisma.chatbotMessage.groupBy({
      by: ['intent'],
      _count: { intent: true },
      orderBy: { _count: { intent: 'desc' } }
    }),

    // Average duration
    prisma.chatbotMessage.aggregate({
      _avg: { duration: true }
    }),

    // Last 10 messages
    prisma.chatbotMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true, email: true } }
          }
        }
      }
    }),

    // Active patients (used chatbot)
    prisma.chatbotMessage.findMany({
      distinct: ['patientId'],
      select: { patientId: true }
    }),
  ]);



  return {
    overview: {
      totalMessages,
      activePatients: activePatients.length,
      avgResponseTime: Math.round(avgDuration._avg.duration || 0),
    },
    providers: {
      gemini: geminiCount,
      ollama: ollamaCount,
      cache: cacheCount,
      geminiPercentage: totalMessages > 0
        ? Math.round((geminiCount / totalMessages) * 100)
        : 0,
      ollamaPercentage: totalMessages > 0
        ? Math.round((ollamaCount / totalMessages) * 100)
        : 0,
      cachePercentage: totalMessages > 0
        ? Math.round((cacheCount / totalMessages) * 100)
        : 0,
    },
    intents: intentStats.map(i => ({
      intent: i.intent,
      count: i._count.intent,
      percentage: totalMessages > 0
        ? Math.round((i._count.intent / totalMessages) * 100)
        : 0,
    })),
    recentMessages: recentMessages.map(m => ({
      id: m.id,
      patient: m.patient.user.fullName,
      email: m.patient.user.email,
      message: m.message,
      provider: m.provider,
      intent: m.intent,
      duration: m.duration,
      createdAt: m.createdAt,
    })),
  };
};

const getPatientPackage = async (userId) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) return null;
  const sub = await prisma.subscription.findFirst({
    where: { patientId: patient.id, status: 'ACTIVE' },
    include: { package: true },
  });
  return sub?.package ?? null;
};

module.exports = { chat, getChatHistory, getChatbotStats, getPatientPackage };