// Type declarations for consumers using TypeScript.
// These are intentionally lightweight and can be expanded with real Azure response shapes later.

export interface ModelMeta {
  name: string;
  displayName?: string;
  capabilities?: string[];
  status?: string;
  source?: string;
}

export interface InvocationOptions {
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

export interface InvocationResult {
  model: string;
  input?: string;
  output?: string;
  image?: string;
  usage?: { [k: string]: number } | null;
  latencyMs?: number;
  [k: string]: any;
}

export interface StreamingDeltaChunk {
  delta?: string; // incremental text
  tokens?: number; // surrogate token counter (approximate)
  limit?: number; // enforced streaming token limit (if any)
  rationale?: string; // human-readable explanation for the applied limit
  event?: 'limit_info' | 'limit_notice' | string; // structured event markers
  truncated?: boolean; // true if stream ended due to policy limit
  finishReason?: string; // model-provided finish reason or policy_cap
  [k: string]: any; // forward compatibility
}

export interface ProvenanceRecord {
  id: string;
  ts: number;
  model: string;
  promptHash: string;
  promptBytes: number;
  latencyMs?: number;
  ok: boolean;
  error: string | null;
  usage: { [k: string]: number } | null;
  limit?: number | null;
  limitRationale?: string | null;
  truncated?: boolean;
  continuationOf?: string | null;
}

export interface AgentHooks {
  beforeInvoke?: (ctx: any) => Promise<void> | void;
  afterInvoke?: (ctx: any) => Promise<void> | void;
  onError?: (ctx: any) => Promise<void> | void;
}

export interface AgentConfig {
  defaultModel?: string;
  hooks?: AgentHooks;
}

export class Agent {
  constructor(config?: AgentConfig);
  listModels(): ModelMeta[];
  invoke(params: { prompt: string; model?: string; options?: InvocationOptions }): Promise<InvocationResult>;
  stream(params: { prompt: string; model?: string; options?: InvocationOptions }): AsyncIterable<StreamingDeltaChunk>;
  continueStream(params: { continuationId: string; extraDirective?: string; options?: InvocationOptions }): AsyncIterable<StreamingDeltaChunk>;
  listContinuations(): { id: string; model: string; created: number | null; limit?: number }[];
  consentGranted(): boolean;
  grantConsent(): void;
  registerTool(tool: ToolSpec): void;
  listTools(): { name: string; description: string }[];
  runTool(name: string, input: any, context?: any): Promise<any>;
  planAndExecute(params: { prompt: string; model?: string; options?: InvocationOptions }): Promise<{ steps: any[]; final: string }>; 
}

export function createAgent(config?: AgentConfig): Agent;

// Registry helpers
export function listAllModels(): ModelMeta[];

// Provenance API (subset)
export function listProvenance(args?: { limit?: number }): ProvenanceRecord[];

// Configure provenance ring & persistence
export function configureProvenance(cfg: { ringSize?: number; jsonlPath?: string }): void;

// Auth mode introspection (azure client)
export function authMode(): 'api-key' | 'aad' | 'none';

// Tool system types
export interface ToolSpec {
  name: string;
  description?: string;
  schema?: any;
  run: (input: any, context: { agent: Agent; [k: string]: any }) => Promise<any> | any;
}

export {}; // ensure this file is treated as a module