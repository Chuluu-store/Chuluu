export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  memberCount: number;
  mediaCount: number;
  createdAt: string;
}