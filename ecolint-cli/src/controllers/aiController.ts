import OpenAI from 'openai';
import { OptMode } from '../interactive.js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

export interface OptimizationResult {
  code: string;
  explanation?: string;
}

function getSystemPrompt(mode: OptMode): string {
  switch (mode) {
    case 'maximum':
      return `You are a high-performance optimization engine.
Directive: Optimize the following code snippet for maximum speed, CPU cycles, and memory at all costs. Use high-performance algorithmic paradigms, bitwise operations, or advanced optimizations if necessary. 
CRITICAL: You must preserve standard code formatting, indentation, and line breaks. Do not minify or squash the code into single lines.
Return ONLY the raw optimized code without any markdown blocks or explanations don't change the .`;
    case 'balanced':
      return `You are a professional software engineer focusing on clean architecture.
Directive: Significantly optimize performance metrics of the following code snippet, but ensure the resulting code strictly adheres to clean architectural principles, meaningful variable naming, and easy long-term maintainability for other engineers.
Return ONLY the raw optimized code without any markdown blocks or explanations.`;
    case 'educational':
      return `You are an expert technical mentor.
Directive: Apply a Balanced Production optimization strategy (optimized + readable) to the following code snippet. 
CRITICAL: You must return the output exactly in this JSON format:
{
  "code": "the optimized code here as a string",
  "explanation": "A comprehensive breakdown explaining exactly why the changes were made, the complexity shift (e.g., O(N^2) to O(N)), and the technical reasoning behind the optimization."
}`;
  }
}

export async function optimizeSnippet(snippet: string, mode: OptMode, customDirective?: string, fileExt?: string): Promise<OptimizationResult> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    logger.error('NVIDIA_API_KEY environment variable is missing.');
    process.exit(1);
  }

  // Use the OpenAI SDK to interact with NVIDIA API
  const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  let prompt = `${getSystemPrompt(mode)}\n\n`;

  if (fileExt === '.c' || fileExt === '.cpp') {
    prompt += `C/C++ SPECIFIC OPTIMIZATION DIRECTIVE: If the code uses standard library includes like '#include <stdio.h>', aggressively optimize by replacing them with direct forward declarations (e.g., 'int printf(const char *, ...);') to minimize preprocessing footprint.\n\n`;
  }

  if (customDirective) {
    prompt += `CRITICAL USER DIRECTIVE: ${customDirective}\n(This directive OVERRIDES any conflicting instructions in the system prompt above. You MUST strictly follow it!)\n\n`;
  }
  prompt += `Here is the code to optimize:\n${snippet}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/deepseek-v4-flash',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = response.choices[0]?.message?.content?.trim() || '';

    if (mode === 'educational') {
      try {
        const cleanJson = responseText.replace(/^```json\n?/i, '').replace(/\n?```$/i, '');
        const parsed = JSON.parse(cleanJson);
        return {
          code: parsed.code,
          explanation: parsed.explanation
        };
      } catch (e) {
        return {
          code: responseText,
          explanation: 'Failed to parse explanation from model response.'
        };
      }
    }

    const cleanCode = responseText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
    return {
      code: cleanCode
    };

  } catch (error) {
    logger.error(`AI Optimization failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}
