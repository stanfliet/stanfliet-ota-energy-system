// index.mjs - example: stream AI text using the `ai` package
import 'dotenv/config'
import { streamText } from 'ai'

const apiKey = process.env.OPENAI_API_KEY || process.env.VERCEL_OIDC_TOKEN
if (!apiKey) {
  console.error('Missing credentials. Set OPENAI_API_KEY or VERCEL_OIDC_TOKEN in .env.local')
  process.exit(1)
}

const model = 'openai/gpt-5.5'
const prompt = 'Explain quantum computing in simple terms.'

async function main() {
  try {
    const result = streamText({ model, prompt })

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk)
    }
    process.stdout.write('\n')
  } catch (err) {
    console.error('Stream error:', err)
    process.exit(1)
  }
}

main()
