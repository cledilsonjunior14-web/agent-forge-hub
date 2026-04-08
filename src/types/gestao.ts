export type UserRole = 'admin' | 'gestor' | 'colaborador';

// We map the gestao explicit access controls to the Supabase unified User object.
export interface GestaoUser {
  id: string; // matches Supabase User ID
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  clientAccess: string[];
  projectAccess: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url' | 'email' | 'phone' | 'money' | 'rating' | 'progress';
  options?: string[];
  required: boolean;
  showInCard: boolean;
}

export interface CustomFieldValue {
  fieldId: string;
  value: any;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  segment: string;
  services: string[];
  status: 'CLIENTES ATIVO' | 'PAUSADO' | 'ENCERRADO' | 'PROSPECTO';
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  comunicacao: 'FREQUENTE' | 'NORMAL' | 'BAIXA' | '';
  crm: string;
  fontesTraFego: 'Meta/Google' | 'Meta' | 'Google' | 'Orgânico' | 'Outro' | '';
  formaPagamento: 'PIX' | 'CARTÃO' | 'BOLETO' | 'TRANSFERÊNCIA' | '';
  dataProximaReuniao: string | null;
  dataUltimaReuniao: string | null;
  dataUltimaEdicao: string | null;
  customFields: CustomFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  type: string;
  status: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente' | 'normal';
  startDate: string | null;
  deadline: string | null;
  assignedTo: string[];
  tags: string[];
  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  clientId: string;
  parentTaskId: string | null;
  title: string;
  description: string;
  status: string;
  priority: 'urgente' | 'alta' | 'normal' | 'baixa';
  isMilestone: boolean;
  assignedTo: string[];
  startDate: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  trackedMinutes: number;
  timerRunning: boolean;
  timerStartedAt: string | null;
  timerHistory: {
    userId: string;
    startedAt: string;
    stoppedAt: string;
    minutes: number;
  }[];
  tags: string[];
  dependencies: string[];
  linkedTasks: string[];
  checklists: Checklist[];
  comments: Comment[];
  attachments: Attachment[];
  customFields: CustomFieldValue[];
  activityLog: ActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assignedTo: string | null;
  dueDate: string | null;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  type: 'comment' | 'assigned_comment';
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  reactions: { emoji: string; userIds: string[] }[];
  replies: Reply[];
  createdAt: string;
}

export interface Reply {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type ActivityAction = 
  | 'created' | 'status_changed' | 'field_changed' | 'assigned' | 'unassigned' | 'commented'
  | 'comment_resolved' | 'checklist_item_done' | 'checklist_item_undone' | 'moved' | 'dependency_added'
  | 'dependency_removed' | 'timer_started' | 'timer_stopped' | 'attachment_added' | 'due_date_changed' | 'priority_changed';

export interface ActivityEntry {
  id: string;
  userId: string;
  action: ActivityAction;
  from?: string;
  to?: string;
  field?: string;
  description: string;
  createdAt: string;
}

export interface FormTemplate {
  id: string;
  projectId: string;
  clientId: string;
  title: string;
  fields: FormField[];
  publicSlug: string;
  autoStatus: string;
  autoAssignTo: string[];
  autoTags: string[];
  confirmationMessage: string;
  isActive: boolean;
  submissionCount: number;
  createdAt: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
}
