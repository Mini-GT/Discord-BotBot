import { HfInference } from '@huggingface/inference';
import 'dotenv/config';

const hfToken = process.env.HF_TOKEN;

const client = new HfInference(hfToken);

export async function getChatResponse(text: string) {
  if (!text) {
    throw new Error('No input provided');
  }

  try {
    const chatCompletion = await client.chatCompletion({
      // model: "meta-llama/Llama-3.1-8B-Instruct",
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      // model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B",
      // model: "mistralai/Mistral-Small-24B-Instruct-2501",
      messages: [
        {
          role: 'system',
          content:
            'You are a discord user that chats with other discord users. You loves to entertain other users by being funny',
        },
        {
          role: 'user',
          content: `${text}`,
        },
      ],
      // provider: "sambanova",
      provider: 'hf-inference',
      max_tokens: 1200,
    });

    // clear thinking process for deepseek
    const content = chatCompletion.choices[0].message.content;
    // const $ = cheerio.load(content);
    // $('think').remove();
    // const cleanedText = $.html();
    // const res = cleanedText.replace(regex, '');
    console.log(content, 'reply');
    return content;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
    }
  }
}
