export type UserRole = 'ADMIN' | 'SALES_MANAGER' | 'SALES_AGENT';

export type Currency = 'MAD' | 'USD' | 'EUR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  location: string;
  quota: number; // in MAD equivalent
  closedRevenue: number;
  activeDealsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export type PipelineStage = 
  | 'NEW_LEAD'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface StageDefinition {
  id: PipelineStage;
  label: string;
  color: string;
  borderClass: string;
  bgClass: string;
  probability: number;
}

export interface DealAttachment {
  id: string;
  dealId: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface Deal {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  value: number;
  currency: Currency;
  stage: PipelineStage;
  probability: number;
  expectedCloseDate: string;
  assignedAgentId: string;
  assignedAgentName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  tags: string[];
  attachments: DealAttachment[];
  notesCount: number;
  lastActivityDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  wonLostReason?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  city: string;
  country: string;
  annualRevenue: number;
  employeeCount: number;
  status: 'ACTIVE' | 'LEAD' | 'CHURNED';
  contactsCount: number;
  activeDealsCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  avatar: string;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  totalDealValue: number;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type LeadSource = 
  | 'LINKEDIN'
  | 'CASABLANCA_TECH_EXPO'
  | 'INBOUND_WEB'
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'PARTNER';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED';

export interface Lead {
  id: string;
  title: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  source: LeadSource;
  score: number; // 0 - 100
  status: LeadStatus;
  estimatedValue: number;
  assignedAgentId: string;
  assignedAgentName: string;
  city: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type ActivityType = 
  | 'CALL'
  | 'MEETING'
  | 'EMAIL'
  | 'NOTE'
  | 'STAGE_CHANGE'
  | 'TASK_COMPLETED';

export interface Activity {
  id: string;
  entityType: 'DEAL' | 'LEAD' | 'COMPANY' | 'CONTACT';
  entityId: string;
  entityTitle: string;
  type: ActivityType;
  title: string;
  description: string;
  performedBy: string;
  performedByRole: UserRole;
  performedAt: string;
  outcome?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dealId?: string;
  dealTitle?: string;
  contactId?: string;
  contactName?: string;
  assignedAgentId: string;
  assignedAgentName: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  createdAt: string;
  deletedAt: string | null;
}

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'STAGE_CHANGE'
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'PERMANENT_DELETE'
  | 'FILE_UPLOAD'
  | 'AUTH_LOGIN';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: UserRole;
  userIp: string;
  timestamp: string;
  details: string;
  changes?: { field: string; before: string; after: string }[];
}

export interface EmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateType: 'FOLLOW_UP' | 'PROPOSAL_SUBMITTED' | 'DEAL_WON' | 'TASK_REMINDER';
  content: string;
  sentAt: string;
  status: 'DELIVERED' | 'QUEUED' | 'OPENED';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  tokenType: string;
}
