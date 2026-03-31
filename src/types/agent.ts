export type AgentStatus = 'active' | 'running' | 'error' | 'idle';

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  system_prompt: string;
  context: string;
  task: string;
  model: string;
  tags: string[];
  version: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  input: string;
  output: string;
  status: 'success' | 'error' | 'running';
  duration_ms: number | null;
  created_at: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version: number;
  system_prompt: string;
  context: string;
  task: string;
  created_at: string;
}
