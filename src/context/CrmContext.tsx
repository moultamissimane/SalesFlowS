import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, UserRole, Currency, Deal, Company, Contact, Lead, Task, 
  Activity, AuditLog, EmailNotification, PipelineStage, DealAttachment 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_COMPANIES, INITIAL_CONTACTS, 
  INITIAL_LEADS, INITIAL_DEALS, INITIAL_TASKS, 
  INITIAL_ACTIVITIES, INITIAL_AUDIT_LOGS 
} from '../data/mockData';

export type ActiveView = 
  | 'dashboard'
  | 'pipeline'
  | 'deals'
  | 'leads'
  | 'companies'
  | 'contacts'
  | 'tasks'
  | 'audit_logs'
  | 'recycle_bin'
  | 'swagger_api'
  | 'architecture';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface CrmContextType {
  currentUser: User;
  users: User[];
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatMoney: (amountInMad: number) => string;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  
  // Data Collections (Non-deleted)
  deals: Deal[];
  companies: Company[];
  contacts: Contact[];
  leads: Lead[];
  tasks: Task[];
  activities: Activity[];
  auditLogs: AuditLog[];
  emailNotifications: EmailNotification[];
  
  // Recycle Bin / Soft-deleted
  trashItems: {
    id: string;
    type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK';
    name: string;
    deletedAt: string;
    deletedBy: string;
  }[];
  
  // Deal Operations
  updateDealStage: (dealId: string, newStage: PipelineStage, reason?: string) => void;
  createDeal: (deal: Partial<Deal>) => Deal;
  updateDeal: (dealId: string, updates: Partial<Deal>) => void;
  softDeleteDeal: (dealId: string) => void;
  uploadAttachment: (dealId: string, file: { name: string; size: number; type: string }) => void;
  deleteAttachment: (dealId: string, attachmentId: string) => void;
  
  // Company & Contact Operations
  createCompany: (company: Partial<Company>) => Company;
  softDeleteCompany: (companyId: string) => void;
  createContact: (contact: Partial<Contact>) => Contact;
  softDeleteContact: (contactId: string) => void;
  
  // Lead Operations
  createLead: (lead: Partial<Lead>) => Lead;
  convertLeadToDeal: (leadId: string, dealTitle: string, dealValue: number) => Deal;
  softDeleteLead: (leadId: string) => void;
  
  // Task Operations
  createTask: (task: Partial<Task>) => Task;
  toggleTaskStatus: (taskId: string) => void;
  softDeleteTask: (taskId: string) => void;
  
  // Activity Operations
  logActivity: (activity: Omit<Activity, 'id' | 'performedAt' | 'performedBy' | 'performedByRole'>) => void;
  
  // Email Operations
  sendEmailNotification: (email: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => void;
  
  // Trash bin restore / purge
  restoreEntity: (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) => void;
  permanentlyPurgeEntity: (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) => void;
  
  // UI State
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  
  // Celebration trigger
  celebrationCount: number;
  triggerCelebration: () => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

const CURRENCY_RATES = {
  MAD: 1,
  USD: 0.10, // 10 MAD = 1 USD
  EUR: 0.092, // 10.87 MAD = 1 EUR
};

export const CrmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  // Default to Manager for realistic pipeline demonstration
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[1]);
  const [currency, setCurrency] = useState<Currency>('MAD');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  
  // Main Data States with LocalStorage persistence fallback
  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem('salesflow_deals');
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });
  
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('salesflow_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });
  
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('salesflow_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });
  
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('salesflow_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('salesflow_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('salesflow_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('salesflow_audit');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });
  
  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [celebrationCount, setCelebrationCount] = useState<number>(0);

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem('salesflow_deals', JSON.stringify(deals));
  }, [deals]);
  useEffect(() => {
    localStorage.setItem('salesflow_companies', JSON.stringify(companies));
  }, [companies]);
  useEffect(() => {
    localStorage.setItem('salesflow_contacts', JSON.stringify(contacts));
  }, [contacts]);
  useEffect(() => {
    localStorage.setItem('salesflow_leads', JSON.stringify(leads));
  }, [leads]);
  useEffect(() => {
    localStorage.setItem('salesflow_tasks', JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem('salesflow_activities', JSON.stringify(activities));
  }, [activities]);
  useEffect(() => {
    localStorage.setItem('salesflow_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const showToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const triggerCelebration = () => {
    setCelebrationCount(c => c + 1);
  };

  const formatMoney = (amountInMad: number): string => {
    const rate = CURRENCY_RATES[currency];
    const converted = amountInMad * rate;
    
    if (currency === 'MAD') {
      return `${Math.round(converted).toLocaleString('fr-MA')} MAD`;
    }
    if (currency === 'USD') {
      return `$${Math.round(converted).toLocaleString('en-US')}`;
    }
    return `€${Math.round(converted).toLocaleString('fr-FR')}`;
  };

  const switchUser = (userId: string) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      showToast('info', 'Switched User Profile', `Now authenticated as ${found.name} (${found.role})`);
      
      // Log login audit
      const log: AuditLog = {
        id: `aud-${Date.now()}`,
        entityType: 'USER',
        entityId: found.id,
        entityName: found.name,
        action: 'AUTH_LOGIN',
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        userIp: '196.200.145.42 (Casablanca, MA)',
        timestamp: new Date().toISOString(),
        details: `Switched authentication identity to ${found.name} [${found.role}]`,
      };
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const switchRole = (role: UserRole) => {
    const userWithRole = users.find(u => u.role === role) || {
      ...currentUser,
      role
    };
    setCurrentUser(userWithRole);
    showToast('info', 'Role Switch Applied', `Active security role changed to ${role}`);
  };

  const recordAudit = (
    action: AuditLog['action'], 
    entityType: string, 
    entityId: string, 
    entityName: string, 
    details: string,
    changes?: { field: string; before: string; after: string }[]
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      entityType,
      entityId,
      entityName,
      action,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      userIp: '196.200.145.42 (Casablanca, MA)',
      timestamp: new Date().toISOString(),
      details,
      changes,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // DEAL OPERATIONS
  const updateDealStage = (dealId: string, newStage: PipelineStage, reason?: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const oldStage = deal.stage;
    if (oldStage === newStage) return;

    let newProb = 50;
    if (newStage === 'NEW_LEAD') newProb = 10;
    else if (newStage === 'CONTACTED') newProb = 25;
    else if (newStage === 'QUALIFIED') newProb = 50;
    else if (newStage === 'PROPOSAL') newProb = 70;
    else if (newStage === 'NEGOTIATION') newProb = 85;
    else if (newStage === 'WON') newProb = 100;
    else if (newStage === 'LOST') newProb = 0;

    const updatedDeals = deals.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          stage: newStage,
          probability: newProb,
          wonLostReason: reason || d.wonLostReason,
          updatedAt: new Date().toISOString(),
          lastActivityDate: new Date().toISOString(),
        };
      }
      return d;
    });

    setDeals(updatedDeals);

    // Activity record
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      entityType: 'DEAL',
      entityId: deal.id,
      entityTitle: deal.title,
      type: 'STAGE_CHANGE',
      title: newStage === 'WON' ? '🎉 Deal Won!' : `Moved to ${newStage.replace('_', ' ')}`,
      description: reason ? `Reason: ${reason}` : `Stage updated from ${oldStage} to ${newStage}`,
      performedBy: currentUser.name,
      performedByRole: currentUser.role,
      performedAt: new Date().toISOString(),
      outcome: `Probability updated to ${newProb}%`,
    };
    setActivities(prev => [newActivity, ...prev]);

    // Audit log
    recordAudit(
      'STAGE_CHANGE',
      'DEAL',
      deal.id,
      deal.title,
      `Updated pipeline stage to ${newStage}${reason ? ` (Reason: ${reason})` : ''}`,
      [
        { field: 'stage', before: oldStage, after: newStage },
        { field: 'probability', before: `${deal.probability}%`, after: `${newProb}%` }
      ]
    );

    // Email trigger simulation
    if (newStage === 'WON') {
      triggerCelebration();
      showToast('success', 'Deal Closed Won!', `Congratulations! ${deal.title} won for ${formatMoney(deal.value)}`);
      sendEmailNotification({
        recipientEmail: deal.contactEmail,
        recipientName: deal.contactName,
        subject: `Partnership Confirmed: ${deal.title}`,
        templateType: 'DEAL_WON',
        content: `Dear ${deal.contactName}, we are thrilled to formally confirm our enterprise agreement for ${deal.title}. Our implementation team in Casablanca is preparing your onboarding kickoff.`
      });
    } else {
      showToast('info', 'Deal Updated', `${deal.title} moved to ${newStage.replace('_', ' ')}`);
    }
  };

  const createDeal = (dealData: Partial<Deal>): Deal => {
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      title: dealData.title || 'Untitled Deal',
      companyId: dealData.companyId || 'comp-1',
      companyName: dealData.companyName || 'Attijari Solutions Cloud',
      contactId: dealData.contactId || 'cont-1',
      contactName: dealData.contactName || 'Mehdi Mansouri',
      contactEmail: dealData.contactEmail || 'm.mansouri@attijari-cloud.ma',
      value: dealData.value || 100000,
      currency: dealData.currency || 'MAD',
      stage: dealData.stage || 'NEW_LEAD',
      probability: dealData.probability || 10,
      expectedCloseDate: dealData.expectedCloseDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      assignedAgentId: dealData.assignedAgentId || currentUser.id,
      assignedAgentName: dealData.assignedAgentName || currentUser.name,
      priority: dealData.priority || 'MEDIUM',
      tags: dealData.tags || ['Enterprise'],
      attachments: [],
      notesCount: 0,
      lastActivityDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    setDeals(prev => [newDeal, ...prev]);

    recordAudit('CREATE', 'DEAL', newDeal.id, newDeal.title, `Created new deal valued at ${newDeal.value} MAD`);
    showToast('success', 'Deal Created', `${newDeal.title} has been added to pipeline`);

    return newDeal;
  };

  const updateDeal = (dealId: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    }));
    recordAudit('UPDATE', 'DEAL', dealId, updates.title || 'Deal', 'Updated deal metadata & details');
    showToast('info', 'Saved Changes', 'Deal properties updated successfully');
  };

  const softDeleteDeal = (dealId: string) => {
    const target = deals.find(d => d.id === dealId);
    if (!target) return;

    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, deletedAt: new Date().toISOString() } : d));
    recordAudit('SOFT_DELETE', 'DEAL', dealId, target.title, 'Soft-deleted deal (moved to Recycle Bin)');
    showToast('warning', 'Moved to Trash', `${target.title} moved to Recycle Bin (can be restored by Admin)`);
  };

  const uploadAttachment = (dealId: string, file: { name: string; size: number; type: string }) => {
    const newAtt: DealAttachment = {
      id: `att-${Date.now()}`,
      dealId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/pdf',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          attachments: [newAtt, ...d.attachments],
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    }));

    recordAudit('FILE_UPLOAD', 'FILE', newAtt.id, newAtt.fileName, `Uploaded file to deal #${dealId}`);
    showToast('success', 'File Uploaded', `${file.name} attached to deal`);
  };

  const deleteAttachment = (dealId: string, attachmentId: string) => {
    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          attachments: d.attachments.filter(a => a.id !== attachmentId),
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    }));
    showToast('info', 'File Removed', 'Attachment deleted');
  };

  // COMPANY OPERATIONS
  const createCompany = (companyData: Partial<Company>): Company => {
    const newComp: Company = {
      id: `comp-${Date.now()}`,
      name: companyData.name || 'New Enterprise Client',
      industry: companyData.industry || 'Technology & Software',
      website: companyData.website || 'https://client.ma',
      phone: companyData.phone || '+212 522 000000',
      city: companyData.city || 'Casablanca',
      country: companyData.country || 'Morocco',
      annualRevenue: companyData.annualRevenue || 10000000,
      employeeCount: companyData.employeeCount || 50,
      status: companyData.status || 'ACTIVE',
      contactsCount: 0,
      activeDealsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    setCompanies(prev => [newComp, ...prev]);
    recordAudit('CREATE', 'COMPANY', newComp.id, newComp.name, 'Created new enterprise company record');
    showToast('success', 'Company Created', `${newComp.name} added to CRM`);
    return newComp;
  };

  const softDeleteCompany = (companyId: string) => {
    const target = companies.find(c => c.id === companyId);
    if (!target) return;
    setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, deletedAt: new Date().toISOString() } : c));
    recordAudit('SOFT_DELETE', 'COMPANY', companyId, target.name, 'Soft-deleted company record');
    showToast('warning', 'Moved to Trash', `${target.name} moved to Recycle Bin`);
  };

  // CONTACT OPERATIONS
  const createContact = (contactData: Partial<Contact>): Contact => {
    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      companyId: contactData.companyId || 'comp-1',
      companyName: contactData.companyName || 'Attijari Solutions Cloud',
      firstName: contactData.firstName || 'Anas',
      lastName: contactData.lastName || 'El Fassi',
      email: contactData.email || 'a.elfassi@company.ma',
      phone: contactData.phone || '+212 660 000000',
      jobTitle: contactData.jobTitle || 'Account Executive',
      avatar: contactData.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      status: 'ACTIVE',
      totalDealValue: 0,
      notesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    setContacts(prev => [newContact, ...prev]);
    recordAudit('CREATE', 'CONTACT', newContact.id, `${newContact.firstName} ${newContact.lastName}`, 'Created contact');
    showToast('success', 'Contact Created', `${newContact.firstName} ${newContact.lastName} added`);
    return newContact;
  };

  const softDeleteContact = (contactId: string) => {
    const target = contacts.find(c => c.id === contactId);
    if (!target) return;
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, deletedAt: new Date().toISOString() } : c));
    recordAudit('SOFT_DELETE', 'CONTACT', contactId, `${target.firstName} ${target.lastName}`, 'Soft-deleted contact');
    showToast('warning', 'Moved to Trash', 'Contact moved to Recycle Bin');
  };

  // LEAD OPERATIONS
  const createLead = (leadData: Partial<Lead>): Lead => {
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      title: leadData.title || 'Inbound Enterprise Lead',
      company: leadData.company || 'Enterprise Prospect',
      contactName: leadData.contactName || 'Lead Contact',
      email: leadData.email || 'contact@lead.ma',
      phone: leadData.phone || '+212 660 000000',
      source: leadData.source || 'CASABLANCA_TECH_EXPO',
      score: leadData.score || 70,
      status: leadData.status || 'NEW',
      estimatedValue: leadData.estimatedValue || 150000,
      assignedAgentId: leadData.assignedAgentId || currentUser.id,
      assignedAgentName: leadData.assignedAgentName || currentUser.name,
      city: leadData.city || 'Casablanca',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };
    setLeads(prev => [newLead, ...prev]);
    recordAudit('CREATE', 'LEAD', newLead.id, newLead.title, `Created lead score ${newLead.score}/100`);
    showToast('success', 'Lead Added', `${newLead.title} registered`);
    return newLead;
  };

  const convertLeadToDeal = (leadId: string, dealTitle: string, dealValue: number): Deal => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    // Create deal from lead
    const createdDeal = createDeal({
      title: dealTitle || lead.title,
      companyName: lead.company,
      contactName: lead.contactName,
      contactEmail: lead.email,
      value: dealValue || lead.estimatedValue,
      stage: 'QUALIFIED',
      probability: 50,
      assignedAgentId: lead.assignedAgentId,
      assignedAgentName: lead.assignedAgentName,
      tags: ['Converted Lead', lead.source]
    });

    // Mark lead as qualified
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'QUALIFIED', updatedAt: new Date().toISOString() } : l));

    recordAudit('UPDATE', 'LEAD', leadId, lead.title, `Converted lead into active Deal #${createdDeal.id}`);
    showToast('success', 'Lead Converted!', `Successfully converted to Deal: ${createdDeal.title}`);
    return createdDeal;
  };

  const softDeleteLead = (leadId: string) => {
    const target = leads.find(l => l.id === leadId);
    if (!target) return;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, deletedAt: new Date().toISOString() } : l));
    recordAudit('SOFT_DELETE', 'LEAD', leadId, target.title, 'Soft-deleted lead record');
    showToast('warning', 'Moved to Trash', 'Lead moved to Recycle Bin');
  };

  // TASK OPERATIONS
  const createTask = (taskData: Partial<Task>): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title || 'Follow up with client',
      description: taskData.description || '',
      dealId: taskData.dealId,
      dealTitle: taskData.dealTitle,
      contactId: taskData.contactId,
      contactName: taskData.contactName,
      assignedAgentId: taskData.assignedAgentId || currentUser.id,
      assignedAgentName: taskData.assignedAgentName || currentUser.name,
      dueDate: taskData.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      priority: taskData.priority || 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    setTasks(prev => [newTask, ...prev]);
    recordAudit('CREATE', 'TASK', newTask.id, newTask.title, 'Created scheduled sales task');
    showToast('success', 'Task Scheduled', newTask.title);
    return newTask;
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        const completedAt = nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined;
        recordAudit('UPDATE', 'TASK', t.id, t.title, `Toggled status to ${nextStatus}`, [
          { field: 'status', before: t.status, after: nextStatus }
        ]);
        return { ...t, status: nextStatus, completedAt };
      }
      return t;
    }));
  };

  const softDeleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t));
    recordAudit('SOFT_DELETE', 'TASK', taskId, target.title, 'Soft-deleted task');
    showToast('warning', 'Task Deleted', 'Moved to Recycle Bin');
  };

  // ACTIVITY LOGGING
  const logActivity = (activity: Omit<Activity, 'id' | 'performedAt' | 'performedBy' | 'performedByRole'>) => {
    const newAct: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      performedBy: currentUser.name,
      performedByRole: currentUser.role,
      performedAt: new Date().toISOString(),
    };
    setActivities(prev => [newAct, ...prev]);
    recordAudit('CREATE', 'ACTIVITY', newAct.id, newAct.title, `Logged ${newAct.type} on ${newAct.entityType}`);
    showToast('info', 'Activity Logged', newAct.title);
  };

  // EMAIL NOTIFICATION SENDER
  const sendEmailNotification = (email: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => {
    const newNotification: EmailNotification = {
      ...email,
      id: `email-${Date.now()}`,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
    };
    setEmailNotifications(prev => [newNotification, ...prev]);
    showToast('success', 'Email Dispatched', `Sent "${email.subject}" to ${email.recipientEmail}`);
  };

  // TRASH / SOFT DELETE RESTORE & PERMANENT PURGE
  const trashItems = [
    ...deals.filter(d => d.deletedAt !== null).map(d => ({
      id: d.id,
      type: 'DEAL' as const,
      name: d.title,
      deletedAt: d.deletedAt!,
      deletedBy: 'Current User'
    })),
    ...companies.filter(c => c.deletedAt !== null).map(c => ({
      id: c.id,
      type: 'COMPANY' as const,
      name: c.name,
      deletedAt: c.deletedAt!,
      deletedBy: 'Current User'
    })),
    ...contacts.filter(c => c.deletedAt !== null).map(c => ({
      id: c.id,
      type: 'CONTACT' as const,
      name: `${c.firstName} ${c.lastName}`,
      deletedAt: c.deletedAt!,
      deletedBy: 'Current User'
    })),
    ...leads.filter(l => l.deletedAt !== null).map(l => ({
      id: l.id,
      type: 'LEAD' as const,
      name: l.title,
      deletedAt: l.deletedAt!,
      deletedBy: 'Current User'
    })),
    ...tasks.filter(t => t.deletedAt !== null).map(t => ({
      id: t.id,
      type: 'TASK' as const,
      name: t.title,
      deletedAt: t.deletedAt!,
      deletedBy: 'Current User'
    }))
  ];

  const restoreEntity = (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) => {
    if (type === 'DEAL') {
      setDeals(prev => prev.map(d => d.id === id ? { ...d, deletedAt: null } : d));
    } else if (type === 'COMPANY') {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, deletedAt: null } : c));
    } else if (type === 'CONTACT') {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, deletedAt: null } : c));
    } else if (type === 'LEAD') {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, deletedAt: null } : l));
    } else if (type === 'TASK') {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, deletedAt: null } : t));
    }
    recordAudit('RESTORE', type, id, `Entity #${id}`, `Restored soft-deleted ${type} record`);
    showToast('success', 'Record Restored', `Restored ${type} back to active pipeline`);
  };

  const permanentlyPurgeEntity = (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('error', 'Permission Denied', 'Only ADMIN role can permanently purge records from database');
      return;
    }

    if (type === 'DEAL') {
      setDeals(prev => prev.filter(d => d.id !== id));
    } else if (type === 'COMPANY') {
      setCompanies(prev => prev.filter(c => c.id !== id));
    } else if (type === 'CONTACT') {
      setContacts(prev => prev.filter(c => c.id !== id));
    } else if (type === 'LEAD') {
      setLeads(prev => prev.filter(l => l.id !== id));
    } else if (type === 'TASK') {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    recordAudit('PERMANENT_DELETE', type, id, `Entity #${id}`, `Hard deleted record permanently (SQL DELETE)`);
    showToast('info', 'Permanently Purged', `Record purged from PostgreSQL database`);
  };

  // Active items (excluding soft-deleted)
  const activeDeals = deals.filter(d => d.deletedAt === null);
  const activeCompanies = companies.filter(c => c.deletedAt === null);
  const activeContacts = contacts.filter(c => c.deletedAt === null);
  const activeLeads = leads.filter(l => l.deletedAt === null);
  const activeTasks = tasks.filter(t => t.deletedAt === null);

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        switchRole,
        currency,
        setCurrency,
        formatMoney,
        activeView,
        setActiveView,
        globalSearch,
        setGlobalSearch,
        deals: activeDeals,
        companies: activeCompanies,
        contacts: activeContacts,
        leads: activeLeads,
        tasks: activeTasks,
        activities,
        auditLogs,
        emailNotifications,
        trashItems,
        updateDealStage,
        createDeal,
        updateDeal,
        softDeleteDeal,
        uploadAttachment,
        deleteAttachment,
        createCompany,
        softDeleteCompany,
        createContact,
        softDeleteContact,
        createLead,
        convertLeadToDeal,
        softDeleteLead,
        createTask,
        toggleTaskStatus,
        softDeleteTask,
        logActivity,
        sendEmailNotification,
        restoreEntity,
        permanentlyPurgeEntity,
        selectedDealId,
        setSelectedDealId,
        toasts,
        removeToast,
        showToast,
        celebrationCount,
        triggerCelebration,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
