export type AIRequest = { task: string; input: string };
export type AIProvider = { generate(request: AIRequest): Promise<string> };
