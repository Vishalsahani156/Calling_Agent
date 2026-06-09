type QueryKey = readonly unknown[];

type ListFilters = Record<string, unknown>;

function featureRoot(feature: string): QueryKey {
  return [feature] as const;
}

export const queryKeys = {
  auth: {
    all: featureRoot('auth'),
    me: (): QueryKey => [...queryKeys.auth.all, 'me'] as const,
  },

  campaigns: {
    all: featureRoot('campaigns'),
    lists: (): QueryKey => [...queryKeys.campaigns.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.campaigns.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.campaigns.details(), id] as const,
    analytics: (id: string): QueryKey =>
      [...queryKeys.campaigns.detail(id), 'analytics'] as const,
    report: (id: string): QueryKey =>
      [...queryKeys.campaigns.detail(id), 'report'] as const,
  },

  contacts: {
    all: featureRoot('contacts'),
    lists: (): QueryKey => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.contacts.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.contacts.details(), id] as const,
    tags: (): QueryKey => [...queryKeys.contacts.all, 'tags'] as const,
    groups: (): QueryKey => [...queryKeys.contacts.all, 'groups'] as const,
    groupsList: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.contacts.groups(), 'list', filters] as const,
    group: (id: string): QueryKey => [...queryKeys.contacts.groups(), id] as const,
  },

  calls: {
    all: featureRoot('calls'),
    lists: (): QueryKey => [...queryKeys.calls.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.calls.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.calls.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.calls.details(), id] as const,
    transcript: (id: string): QueryKey =>
      [...queryKeys.calls.detail(id), 'transcript'] as const,
    recording: (id: string): QueryKey =>
      [...queryKeys.calls.detail(id), 'recording'] as const,
  },

  agents: {
    all: featureRoot('agents'),
    lists: (): QueryKey => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.agents.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.agents.details(), id] as const,
  },

  knowledge: {
    all: featureRoot('knowledge'),
    lists: (): QueryKey => [...queryKeys.knowledge.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.knowledge.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.knowledge.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.knowledge.details(), id] as const,
    documents: (knowledgeBaseId: string): QueryKey =>
      [...queryKeys.knowledge.detail(knowledgeBaseId), 'documents'] as const,
    document: (documentId: string): QueryKey =>
      [...queryKeys.knowledge.all, 'document', documentId] as const,
    faqs: (knowledgeBaseId: string): QueryKey =>
      [...queryKeys.knowledge.detail(knowledgeBaseId), 'faqs'] as const,
  },

  analytics: {
    all: featureRoot('analytics'),
    overview: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.analytics.all, 'overview', filters] as const,
    campaign: (id: string): QueryKey =>
      [...queryKeys.analytics.all, 'campaign', id] as const,
    calls: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.analytics.all, 'calls', filters] as const,
  },

  settings: {
    all: featureRoot('settings'),
    current: (): QueryKey => [...queryKeys.settings.all, 'current'] as const,
  },

  users: {
    all: featureRoot('users'),
    lists: (): QueryKey => [...queryKeys.users.all, 'list'] as const,
    list: (filters: ListFilters = {}): QueryKey =>
      [...queryKeys.users.lists(), filters] as const,
    details: (): QueryKey => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string): QueryKey => [...queryKeys.users.details(), id] as const,
    roles: (): QueryKey => [...queryKeys.users.all, 'roles'] as const,
  },
} as const;
