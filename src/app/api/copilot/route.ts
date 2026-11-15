import { handleCopilotRequest } from '@/lib/copilot-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export async function POST(request: Request) {
  return handleCopilotRequest(request, {env:{
    DEEPSEEK_API_KEY:process.env.DEEPSEEK_API_KEY,DEEPSEEK_MODEL:process.env.DEEPSEEK_MODEL,
    GEMINI_API_KEY:process.env.GEMINI_API_KEY,GEMINI_MODEL:process.env.GEMINI_MODEL,
    OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL,
  }});
}

export async function GET() {
  return Response.json({service:'PyroZero copilot',method:'POST',stages:['retrieve','compute','synthesize']});
}
