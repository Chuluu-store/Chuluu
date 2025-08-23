export interface Group {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  isOwner: boolean;
  memberCount: number;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}
