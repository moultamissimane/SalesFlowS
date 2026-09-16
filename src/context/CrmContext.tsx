import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  User, UserRole, Currency, Deal, Company, Contact, Lead, Task,
  Activity, AuditLog, EmailNotification, PipelineStage, DealAttachment
} from '../types';
import { tryRestoreSession, setAccessToken } from '../api/client';
import { authApi } from '../api/authApi';
import { usersApi } from '../api/usersApi';
import { companiesApi } from '../api/companiesApi';
import { contactsApi } from '../api/contactsApi';
import { leadsApi } from '../api/leadsApi';
import { dealsApi } from '../api/dealsApi';
import { tasksApi } from '../api/tasksApi';
import { activitiesApi } from '../api/activitiesApi';
import { auditLogsApi } from '../api/auditLogsApi';
import { emailsApi } from '../api/emailsApi';
import { recycleBinApi, TrashEntityType } from '../api/recycleBinApi';
import { DEMO_PASSWORD } from '../data/demoPersonas';

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
  // Auth
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role: UserRole, department?: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

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
  createDeal: (deal: Partial<Deal>) => void;
  updateDeal: (dealId: string, updates: Partial<Deal>) => void;
  softDeleteDeal: (dealId: string) => void;
  uploadAttachment: (dealId: string, file: File) => void;
  deleteAttachment: (dealId: string, attachmentId: string) => void;

  // Company & Contact Operations
  createCompany: (company: Partial<Company>) => void;
  softDeleteCompany: (companyId: string) => void;
  createContact: (contact: Partial<Contact> & { avatar?: string }) => void;
  softDeleteContact: (contactId: string) => void;

  // Lead Operations
  createLead: (lead: Partial<Lead>) => void;
  convertLeadToDeal: (leadId: string, dealTitle: string, dealValue: number) => void;
  softDeleteLead: (leadId: string) => void;

  // Task Operations
  createTask: (task: Partial<Task>) => void;
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

const CURRENCY_RATES = { MAD: 1, USD: 0.10, EUR: 0.092 };

const GUEST_USER: User = {
  id: '', name: '', email: '', role: 'SALES_AGENT', avatar: '',
  department: '', location: '', quota: 0, status: 'ACTIVE',
};

export const CrmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [currency, setCurrency] = useState<Currency>('MAD');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [celebrationCount, setCelebrationCount] = useState<number>(0);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4500);
  }, []);

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));
  const triggerCelebration = () => setCelebrationCount(c => c + 1);

  // ---- Session bootstrap: try the httpOnly refresh cookie once on load ----
  useEffect(() => {
    (async () => {
      try {
        const token = await tryRestoreSession();
        if (token) {
          const me = await usersApi.me();
          setCurrentUser(me);
          setIsAuthenticated(true);
        }
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  // Re-fetch everything once React has re-rendered with the new currentUser/role - invalidating
  // synchronously inside the login handler would refetch role-gated queries (dashboard, audit
  // logs, emails) while they're still configured with the *previous* user's `enabled` flag,
  // producing spurious 403s against endpoints the new role can't see.
  useEffect(() => {
    if (!isAuthenticated) return;
    // Deferred to a macrotask so this runs after react-query's own hooks (declared further
    // down this component) have re-subscribed with this render's `enabled` flags - otherwise
    // invalidation can race ahead of them and refetch a query that's about to become disabled.
    const id = setTimeout(() => queryClient.invalidateQueries(), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  const onAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    onAuthSuccess(res.user);
    showToast('success', 'Logged In', `Authenticated as ${res.user.name} (${res.user.role})`);
  };

  const register = async (fullName: string, email: string, password: string, role: UserRole, department?: string) => {
    const res = await authApi.register(fullName, email, password, role, department);
    onAuthSuccess(res.user);
    showToast('success', 'Account Registered', `Welcome to SalesFlow, ${res.user.name}!`);
  };

  const logoutUser = async () => {
    await authApi.logout();
    setAccessToken(null);
    setCurrentUser(GUEST_USER);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
    showToast('info', 'Password Reset Email Dispatched', `Reset instructions sent to ${email}`);
  };

  const resetPassword = async (token: string, newPassword: string) => {
    await authApi.resetPassword(token, newPassword);
    showToast('success', 'Password Updated', 'You can now sign in with your new password');
  };

  // "Portfolio testing" convenience: re-authenticate as a known demo account.
  const switchUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    await login(target.email, DEMO_PASSWORD);
  };

  const switchRole = async (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (!target) {
      showToast('warning', 'No Demo Account', `No seeded account with role ${role}`);
      return;
    }
    await login(target.email, DEMO_PASSWORD);
  };

  const formatMoney = (amountInMad: number): string => {
    const rate = CURRENCY_RATES[currency];
    const converted = amountInMad * rate;
    if (currency === 'MAD') return `${Math.round(converted).toLocaleString('fr-MA')} MAD`;
    if (currency === 'USD') return `$${Math.round(converted).toLocaleString('en-US')}`;
    return `€${Math.round(converted).toLocaleString('fr-FR')}`;
  };

  // ---------------------------------------------------------------------
  // Queries - flat, reasonably-sized windows (the API itself fully supports
  // server-side pagination/filtering/sorting/search; these list views were
  // designed around an in-memory array, so we fetch a generous page once and
  // let the existing client-side table/filter UI keep working unchanged).
  // ---------------------------------------------------------------------
  const enabled = isAuthenticated;

  const usersQuery = useQuery({ queryKey: ['users'], queryFn: usersApi.list, enabled });
  const companiesQuery = useQuery({ queryKey: ['companies'], queryFn: () => companiesApi.list(), enabled });
  const contactsQuery = useQuery({ queryKey: ['contacts'], queryFn: () => contactsApi.list(), enabled });
  const leadsQuery = useQuery({ queryKey: ['leads'], queryFn: () => leadsApi.list(), enabled });
  const dealsQuery = useQuery({ queryKey: ['deals'], queryFn: () => dealsApi.list(), enabled });
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list(), enabled });
  const activitiesQuery = useQuery({ queryKey: ['activities'], queryFn: activitiesApi.listAll, enabled });
  const auditLogsQuery = useQuery({ queryKey: ['auditLogs'], queryFn: auditLogsApi.list, enabled: enabled && currentUser.role === 'ADMIN' });
  const emailsQuery = useQuery({ queryKey: ['emails'], queryFn: emailsApi.list, enabled: enabled && currentUser.role === 'ADMIN' });
  const trashQuery = useQuery({ queryKey: ['trash'], queryFn: recycleBinApi.list, enabled });

  const users = usersQuery.data ?? [];
  const companies = (companiesQuery.data?.content ?? []);
  const contacts = (contactsQuery.data?.content ?? []);
  const leads = (leadsQuery.data?.content ?? []);
  const deals = (dealsQuery.data?.content ?? []);
  const tasks = (tasksQuery.data?.content ?? []);
  const activities = activitiesQuery.data ?? [];
  const auditLogs = auditLogsQuery.data ?? [];
  const emailNotifications = emailsQuery.data ?? [];
  const trashItems = trashQuery.data ?? [];

  const invalidate = (...keys: string[]) => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));

  // ---------------------------------------------------------------------
  // Deal mutations
  // ---------------------------------------------------------------------
  const updateDealStageMutation = useMutation({
    mutationFn: ({ dealId, newStage, reason }: { dealId: string; newStage: PipelineStage; reason?: string }) =>
      dealsApi.updateStage(dealId, newStage, reason),
    onMutate: async ({ dealId, newStage }) => {
      await queryClient.cancelQueries({ queryKey: ['deals'] });
      const previous = queryClient.getQueryData(['deals']);
      queryClient.setQueryData(['deals'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((d: Deal) => d.id === dealId ? { ...d, stage: newStage } : d),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['deals'], context.previous);
      showToast('error', 'Update Failed', 'Could not update the deal stage');
    },
    onSuccess: (updated, { newStage }) => {
      invalidate('deals', 'activities', 'auditLogs');
      if (newStage === 'WON') {
        triggerCelebration();
        showToast('success', 'Deal Closed Won!', `Congratulations! ${updated.title} won for ${formatMoney(updated.value)}`);
      } else {
        showToast('info', 'Deal Updated', `${updated.title} moved to ${newStage.replace('_', ' ')}`);
      }
    },
  });
  const updateDealStage = (dealId: string, newStage: PipelineStage, reason?: string) =>
    updateDealStageMutation.mutate({ dealId, newStage, reason });

  const createDealMutation = useMutation({
    mutationFn: (deal: Partial<Deal>) => dealsApi.create(deal as Record<string, unknown>),
    onSuccess: (created) => {
      invalidate('deals', 'auditLogs');
      showToast('success', 'Deal Created', `${created.title} has been added to pipeline`);
    },
    onError: () => showToast('error', 'Create Failed', 'Could not create the deal'),
  });
  const createDeal = (deal: Partial<Deal>) => createDealMutation.mutate(deal);

  const updateDealMutation = useMutation({
    mutationFn: ({ dealId, updates }: { dealId: string; updates: Partial<Deal> }) =>
      dealsApi.update(dealId, updates as Record<string, unknown>),
    onSuccess: () => {
      invalidate('deals', 'auditLogs');
      showToast('info', 'Saved Changes', 'Deal properties updated successfully');
    },
  });
  const updateDeal = (dealId: string, updates: Partial<Deal>) => updateDealMutation.mutate({ dealId, updates });

  const softDeleteDealMutation = useMutation({
    mutationFn: (dealId: string) => dealsApi.remove(dealId),
    onSuccess: (_r, dealId) => {
      const target = deals.find(d => d.id === dealId);
      invalidate('deals', 'trash', 'auditLogs');
      showToast('warning', 'Moved to Trash', `${target?.title ?? 'Deal'} moved to Recycle Bin (can be restored by Admin)`);
    },
  });
  const softDeleteDeal = (dealId: string) => softDeleteDealMutation.mutate(dealId);

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ dealId, file }: { dealId: string; file: File }) => dealsApi.uploadAttachment(dealId, file),
    onSuccess: (_r, { file }) => {
      invalidate('deals', 'auditLogs');
      showToast('success', 'File Uploaded', `${file.name} attached to deal`);
    },
    onError: () => showToast('error', 'Upload Failed', 'Could not upload the file'),
  });
  const uploadAttachment = (dealId: string, file: File) => uploadAttachmentMutation.mutate({ dealId, file });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ dealId, attachmentId }: { dealId: string; attachmentId: string }) =>
      dealsApi.deleteAttachment(dealId, attachmentId),
    onSuccess: () => {
      invalidate('deals');
      showToast('info', 'File Removed', 'Attachment deleted');
    },
  });
  const deleteAttachment = (dealId: string, attachmentId: string) => deleteAttachmentMutation.mutate({ dealId, attachmentId });

  // ---------------------------------------------------------------------
  // Company mutations
  // ---------------------------------------------------------------------
  const createCompanyMutation = useMutation({
    mutationFn: (company: Partial<Company>) => companiesApi.create(company),
    onSuccess: (created) => {
      invalidate('companies', 'auditLogs');
      showToast('success', 'Company Created', `${created.name} added to CRM`);
    },
  });
  const createCompany = (company: Partial<Company>) => createCompanyMutation.mutate(company);

  const softDeleteCompanyMutation = useMutation({
    mutationFn: (companyId: string) => companiesApi.remove(companyId),
    onSuccess: (_r, companyId) => {
      const target = companies.find(c => c.id === companyId);
      invalidate('companies', 'trash', 'auditLogs');
      showToast('warning', 'Moved to Trash', `${target?.name ?? 'Company'} moved to Recycle Bin`);
    },
  });
  const softDeleteCompany = (companyId: string) => softDeleteCompanyMutation.mutate(companyId);

  // ---------------------------------------------------------------------
  // Contact mutations
  // ---------------------------------------------------------------------
  const createContactMutation = useMutation({
    mutationFn: (contact: Partial<Contact> & { avatar?: string }) => contactsApi.create(contact),
    onSuccess: (created) => {
      invalidate('contacts', 'companies', 'auditLogs');
      showToast('success', 'Contact Created', `${created.firstName} ${created.lastName} added`);
    },
  });
  const createContact = (contact: Partial<Contact> & { avatar?: string }) => createContactMutation.mutate(contact);

  const softDeleteContactMutation = useMutation({
    mutationFn: (contactId: string) => contactsApi.remove(contactId),
    onSuccess: () => {
      invalidate('contacts', 'companies', 'trash', 'auditLogs');
      showToast('warning', 'Moved to Trash', 'Contact moved to Recycle Bin');
    },
  });
  const softDeleteContact = (contactId: string) => softDeleteContactMutation.mutate(contactId);

  // ---------------------------------------------------------------------
  // Lead mutations
  // ---------------------------------------------------------------------
  const createLeadMutation = useMutation({
    mutationFn: (lead: Partial<Lead>) => leadsApi.create(lead),
    onSuccess: (created) => {
      invalidate('leads', 'auditLogs');
      showToast('success', 'Lead Added', `${created.title} registered`);
    },
  });
  const createLead = (lead: Partial<Lead>) => createLeadMutation.mutate(lead);

  const convertLeadToDealMutation = useMutation({
    mutationFn: ({ leadId, dealTitle, dealValue }: { leadId: string; dealTitle: string; dealValue: number }) =>
      leadsApi.convertToDeal(leadId, dealTitle, dealValue),
    onSuccess: () => {
      invalidate('leads', 'deals', 'companies', 'contacts', 'auditLogs');
      showToast('success', 'Lead Converted!', 'Successfully converted to an active deal');
    },
  });
  const convertLeadToDeal = (leadId: string, dealTitle: string, dealValue: number) =>
    convertLeadToDealMutation.mutate({ leadId, dealTitle, dealValue });

  const softDeleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => leadsApi.remove(leadId),
    onSuccess: () => {
      invalidate('leads', 'trash', 'auditLogs');
      showToast('warning', 'Moved to Trash', 'Lead moved to Recycle Bin');
    },
  });
  const softDeleteLead = (leadId: string) => softDeleteLeadMutation.mutate(leadId);

  // ---------------------------------------------------------------------
  // Task mutations
  // ---------------------------------------------------------------------
  const createTaskMutation = useMutation({
    mutationFn: (task: Partial<Task>) => tasksApi.create(task),
    onSuccess: (created) => {
      invalidate('tasks', 'auditLogs');
      showToast('success', 'Task Scheduled', created.title);
    },
  });
  const createTask = (task: Partial<Task>) => createTaskMutation.mutate(task);

  const toggleTaskStatusMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.toggleStatus(taskId),
    onSuccess: () => invalidate('tasks', 'auditLogs'),
  });
  const toggleTaskStatus = (taskId: string) => toggleTaskStatusMutation.mutate(taskId);

  const softDeleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(taskId),
    onSuccess: () => {
      invalidate('tasks', 'trash', 'auditLogs');
      showToast('warning', 'Task Deleted', 'Moved to Recycle Bin');
    },
  });
  const softDeleteTask = (taskId: string) => softDeleteTaskMutation.mutate(taskId);

  // ---------------------------------------------------------------------
  // Activity / Email
  // ---------------------------------------------------------------------
  const logActivityMutation = useMutation({
    mutationFn: (activity: Omit<Activity, 'id' | 'performedAt' | 'performedBy' | 'performedByRole'>) =>
      activitiesApi.create(activity),
    onSuccess: (created) => {
      invalidate('activities');
      showToast('info', 'Activity Logged', created.title);
    },
  });
  const logActivity = (activity: Omit<Activity, 'id' | 'performedAt' | 'performedBy' | 'performedByRole'>) =>
    logActivityMutation.mutate(activity);

  const sendEmailNotificationMutation = useMutation({
    mutationFn: (email: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => emailsApi.send(email),
    onSuccess: (_r, email) => {
      invalidate('emails');
      showToast('success', 'Email Dispatched', `Sent "${email.subject}" to ${email.recipientEmail}`);
    },
  });
  const sendEmailNotification = (email: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) =>
    sendEmailNotificationMutation.mutate(email);

  // ---------------------------------------------------------------------
  // Recycle bin
  // ---------------------------------------------------------------------
  const restoreEntityMutation = useMutation({
    mutationFn: ({ type, id }: { type: TrashEntityType; id: string }) => recycleBinApi.restore(type, id),
    onSuccess: (_r, { type }) => {
      invalidate('trash', 'deals', 'companies', 'contacts', 'leads', 'tasks', 'auditLogs');
      showToast('success', 'Record Restored', `Restored ${type} back to active pipeline`);
    },
  });
  const restoreEntity = (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) =>
    restoreEntityMutation.mutate({ type, id });

  const permanentlyPurgeEntityMutation = useMutation({
    mutationFn: ({ type, id }: { type: TrashEntityType; id: string }) => recycleBinApi.purge(type, id),
    onSuccess: () => {
      invalidate('trash', 'auditLogs');
      showToast('info', 'Permanently Purged', 'Record purged from the database');
    },
    onError: () => showToast('error', 'Permission Denied', 'Only ADMIN role can permanently purge records'),
  });
  const permanentlyPurgeEntity = (type: 'DEAL' | 'COMPANY' | 'CONTACT' | 'LEAD' | 'TASK', id: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('error', 'Permission Denied', 'Only ADMIN role can permanently purge records from database');
      return;
    }
    permanentlyPurgeEntityMutation.mutate({ type, id });
  };

  return (
    <CrmContext.Provider
      value={{
        isAuthenticated, isBootstrapping, login, register, logoutUser, forgotPassword, resetPassword,
        currentUser, users, switchUser, switchRole,
        currency, setCurrency, formatMoney,
        activeView, setActiveView, globalSearch, setGlobalSearch,
        deals, companies, contacts, leads, tasks, activities, auditLogs, emailNotifications,
        trashItems,
        updateDealStage, createDeal, updateDeal, softDeleteDeal, uploadAttachment, deleteAttachment,
        createCompany, softDeleteCompany,
        createContact, softDeleteContact,
        createLead, convertLeadToDeal, softDeleteLead,
        createTask, toggleTaskStatus, softDeleteTask,
        logActivity,
        sendEmailNotification,
        restoreEntity, permanentlyPurgeEntity,
        selectedDealId, setSelectedDealId,
        toasts, removeToast, showToast,
        celebrationCount, triggerCelebration,
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
