import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "../../../shared/config";
import { apiClient, ApiResponse } from "../../../shared/api";
import { Album, AlbumCreate, AlbumUpdate, SharedAlbum } from "../model";

export function useAlbumList() {
  return useQuery({
    queryKey: QUERY_KEYS.albums.list(),
    queryFn: async (): Promise<Album[]> => {
      const response = await apiClient.get<ApiResponse<Album[]>>("/albums");
      return response.data || [];
    },
  });
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.albums.detail(id),
    queryFn: async (): Promise<Album> => {
      const response = await apiClient.get<ApiResponse<Album>>(`/albums/${id}`);
      if (!response.data) {
        throw new Error("Album not found");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useSharedAlbum(token: string) {
  return useQuery({
    queryKey: QUERY_KEYS.shared.album(token),
    queryFn: async (): Promise<SharedAlbum> => {
      const response = await apiClient.get<ApiResponse<SharedAlbum>>(
        `/shared/${token}`
      );
      if (!response.data) {
        throw new Error("Shared album not found");
      }
      return response.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumData: AlbumCreate): Promise<Album> => {
      const response = await apiClient.post<ApiResponse<Album>>(
        "/albums",
        albumData
      );
      if (!response.data) {
        throw new Error("Failed to create album");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.albums.list() });
    },
  });
}

export function useUpdateAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: AlbumUpdate;
    }): Promise<Album> => {
      const response = await apiClient.put<ApiResponse<Album>>(
        `/albums/${id}`,
        updates
      );
      if (!response.data) {
        throw new Error("Failed to update album");
      }
      return response.data;
    },
    onSuccess: (album) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.albums.list() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.albums.detail(album.id),
      });
    },
  });
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/albums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.albums.list() });
    },
  });
}

export function useGenerateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (albumId: string): Promise<string> => {
      const response = await apiClient.post<
        ApiResponse<{ shareToken: string }>
      >(`/albums/${albumId}/share`);
      if (!response.data?.shareToken) {
        throw new Error("Failed to generate share token");
      }
      return response.data.shareToken;
    },
    onSuccess: (_, albumId) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.albums.detail(albumId),
      });
    },
  });
}
