require('dotenv').config();
const axios = require('axios');

const askAI = async (instructions, context) => {
  if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
    throw new Error('OpenRouter configuration is missing.');
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: process.env.OPENROUTER_MODEL,
      
      reasoning: {
            enabled: false,
       },
      messages: [
        {
          role: 'system',
          content: instructions,
        },
        {
          role: 'user',
          content: context,
        },
      ],
      max_tokens: 4000,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  if (response.data.error) {
        const error = new Error(
            response.data.error.message || 'AI provider failed.'
        );

        error.status = response.data.error.code;
        throw error;
    }

  const answer = response.data.choices?.[0];
  
  console.log('AI response details:', {
  httpStatus: response.status,
  bodyType: typeof response.data,
  providerErrorCode: response.data.error?.code,
  providerErrorMessage: response.data.error?.message,
  choiceCount: response.data.choices?.length,
  finishReason: answer?.finish_reason,
  contentType: typeof answer?.message?.content,
  contentLength: answer?.message?.content?.length,
  hasReasoning: Boolean(answer?.message?.reasoning),
});

  if (answer?.finish_reason === 'length') {
    throw new Error('The AI response reached its output limit.');
  }

  const text = answer?.message?.content;

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('The AI did not return a text response.');
  }

  return text;
};

module.exports = { askAI };