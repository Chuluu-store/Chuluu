import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../shared/api";
import { QUERY_KEYS } from "../../../shared/config";
import { validateFile } from "../../../shared/lib";
import { Media } from "../../../entities/media";
import { UploadResult } from "../model";

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      albumId,
      onProgress,
    }: {
      files: File[];
      albumId?: string;
      onProgress?: (fileId: string, progress: number) => void;
    }): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      for (const file of files) {
        try {
          // Validate file
          const validation = validateFile(file);
          if (!validation.isValid) {
            results.push({
              success: false,
              error: validation.error,
            });
            continue;
          }

          // Create form data
          const formData = new FormData();
          formData.append("file", file);
          if (albumId) formData.append("albumId", albumId);

          // Upload with progress tracking
          const response = await apiClient.upload<{
            success: boolean;
            data?: Media;
          }>("/upload", formData, (progress) =>
            onProgress?.(file.name, progress)
          );

          if (response.success && response.data) {
            results.push({
              success: true,
              mediaId: response.data.id,
            });
          } else {
            results.push({
              success: false,
              error: "Upload failed",
            });
          }
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media.all });
    },
  });
}
