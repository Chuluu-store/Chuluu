export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: "ko" | "en";
  gridSize: "small" | "medium" | "large";
  autoUpload: boolean;
  showMetadata: boolean;
}
