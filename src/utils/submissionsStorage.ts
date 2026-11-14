export interface SubmissionItem {
  id: string;
  type: 'collaboration' | 'contact' | 'service';
  createdAt: string;
  timestamp: number;
  senderName: string;
  email: string;
  phone: string;
  service?: string;
  brandName?: string;
  collabType?: string;
  category?: string;
  message: string;
  deadline?: string;
  budget?: string;
  status: 'new' | 'contacted' | 'archived';
  emailDelivered: boolean;
}

const STORAGE_KEY = 'anand_portfolio_submissions_v1';

export const getSubmissions = (): SubmissionItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.timestamp - a.timestamp);
    }
    return [];
  } catch (error) {
    console.error('Failed to read submissions from localStorage:', error);
    return [];
  }
};

export const setCachedSubmissions = (items: SubmissionItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    window.dispatchEvent(new Event('submissions_updated'));
  } catch (error) {
    console.error('Failed to cache submissions in localStorage:', error);
  }
};

export const upsertSubmissionInCache = (item: SubmissionItem): void => {
  const existing = getSubmissions().filter((s) => s.id !== item.id);
  setCachedSubmissions([item, ...existing]);
};

export const fetchSubmissionsFromServer = async (): Promise<SubmissionItem[]> => {
  try {
    const res = await fetch('/api/submissions', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return getSubmissions();
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.submissions)) {
      setCachedSubmissions(data.submissions);
      return data.submissions;
    }
    return getSubmissions();
  } catch (error) {
    console.error('Failed to fetch submissions from server:', error);
    return getSubmissions();
  }
};

export const saveSubmission = (
  item: Omit<SubmissionItem, 'id' | 'createdAt' | 'timestamp' | 'status'>
): SubmissionItem => {
  const existing = getSubmissions();
  const now = new Date();

  const newItem: SubmissionItem = {
    ...item,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: now.getTime(),
    status: 'new',
  };

  setCachedSubmissions([newItem, ...existing]);
  return newItem;
};

export const updateSubmissionStatus = async (
  id: string,
  status: SubmissionItem['status']
): Promise<void> => {
  const existing = getSubmissions();
  const updated = existing.map((sub) => (sub.id === id ? { ...sub, status } : sub));
  setCachedSubmissions(updated);

  try {
    await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    console.error('Failed to update submission status on server:', error);
  }
};

export const deleteSubmission = async (id: string): Promise<void> => {
  const existing = getSubmissions();
  const updated = existing.filter((sub) => sub.id !== id);
  setCachedSubmissions(updated);

  try {
    await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete submission on server:', error);
  }
};

export const clearAllSubmissions = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('submissions_updated'));
    await fetch('/api/submissions', { method: 'DELETE' });
  } catch (error) {
    console.error('Failed to clear submissions:', error);
  }
};

export const exportSubmissionsCSV = (): void => {
  const submissions = getSubmissions();
  if (submissions.length === 0) return;

  const headers = ['Төрөл', 'Огноо', 'Брэнд/Байгууллага', 'Нэр', 'Утас', 'И-мэйл', 'Формат', 'Чиглэл', 'Дедлайн', 'Төсөв', 'Зурвас', 'Төлөв'];
  const rows = submissions.map((s) => [
    s.type === 'collaboration' ? 'Хамтын ажиллагаа' : 'Шууд зурвас',
    `"${s.createdAt}"`,
    `"${(s.brandName || '').replace(/"/g, '""')}"`,
    `"${(s.senderName || '').replace(/"/g, '""')}"`,
    `"${(s.phone || '').replace(/"/g, '""')}"`,
    `"${(s.email || '').replace(/"/g, '""')}"`,
    `"${(s.collabType || '').replace(/"/g, '""')}"`,
    `"${(s.category || '').replace(/"/g, '""')}"`,
    `"${(s.deadline || '').replace(/"/g, '""')}"`,
    `"${(s.budget || '').replace(/"/g, '""')}"`,
    `"${(s.message || '').replace(/"/g, '""')}"`,
    s.status === 'new' ? 'Шинэ' : s.status === 'contacted' ? 'Холбогдсон' : 'Архивлагдсан'
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `anand_huseltuud_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
