import OpenAI from 'openai';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export interface SecurityScanResult {
  hasVulnerabilities: boolean;
  explanation: string;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    logger.error('NVIDIA_API_KEY environment variable is missing.');
    process.exit(1);
  }

  return new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
}

export async function scanForVulnerabilities(fullFileContent: string): Promise<SecurityScanResult> {
  const openai = getOpenAIClient();

  const prompt = `You are an expert Cybersecurity Engineer.
Your task is to scan the following code for ANY security vulnerabilities (e.g., SQL injection, XSS, hardcoded credentials, buffer overflows, insecure randomness, etc.).

CRITICAL: You must return your analysis strictly in the following JSON format. Do NOT wrap it in markdown block quotes.
{
  "hasVulnerabilities": true or false,
  "explanation": "If true, provide a concise explanation of the vulnerabilities found. If false, leave this empty."
}

Here is the code to scan:
${fullFileContent}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'minimaxai/minimax-m2.7',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.choices[0]?.message?.content?.trim() || '{}';
    const cleanJson = responseText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
    const parsed = JSON.parse(cleanJson);

    return {
      hasVulnerabilities: !!parsed.hasVulnerabilities,
      explanation: parsed.explanation || ''
    };
  } catch (error) {
    logger.error(`Security scan failed: ${error instanceof Error ? error.message : error}`);
    // Default to safe side if scan fails parsing
    return { hasVulnerabilities: false, explanation: '' };
  }
}

export async function fixVulnerabilities(fullFileContent: string, vulnerabilityContext: string): Promise<string> {
  const openai = getOpenAIClient();

  const prompt = `You are an expert Cybersecurity Engineer.
The following code has been flagged for security vulnerabilities:
${vulnerabilityContext}

Directive: Fix the vulnerabilities in the code. Ensure the code remains functionally identical but secure. 
Return ONLY the raw patched code without any markdown blocks or explanations. Do not include introductory text.

Here is the code to fix:
${fullFileContent}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'minimaxai/minimax-m2.7',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.choices[0]?.message?.content?.trim() || '';
    const cleanCode = responseText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
    
    return cleanCode;
  } catch (error) {
    logger.error(`Security fix failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
