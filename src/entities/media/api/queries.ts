import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiResponse } from "../../../shared/api";
import { QUERY_KEYS } from "../../../shared/config";
import { Media, MediaFilter } from "../model";

export function useMediaList(filter?: MediaFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.media.list(filter?.page, filter?.limit),
    queryFn: async (): Promise<Media[]> => {
      const params = new URLSearchParams();

      if (filter?.type) params.append("type", filter.type);
      if (filter?.albumId) params.append("albumId", filter.albumId);
      if (filter?.search) params.append("search", filter.search);
      if (filter?.dateFrom)
        params.append("dateFrom", filter.dateFrom.toISOString());
      if (filter?.dateTo) params.append("dateTo", filter.dateTo.toISOString());

      const queryString = params.toString();
      const url = queryString ? `/media?${queryString}` : "/media";

      const response = await apiClient.get<ApiResponse<Media[]>>(url);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMedia(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.media.detail(id),
    queryFn: async (): Promise<Media> => {
      const response = await apiClient.get<ApiResponse<Media>>(`/media/${id}`);
      if (!response.data) {
        throw new Error("Media not found");
      }
      return response.data;
    },
    enabled: !!id,
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
}

export function useDeleteMultipleMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<void> => {
      await apiClient.post("/media/delete-multiple", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
}
