import axios from 'axios';

import { api } from '@/api/client';
import type { PresignResponse, UploadResponse } from '@/api/generated/types.gen';

export type PickedFile = { uri: string; mimeType: string; name: string };

/** Uploads via a presigned S3 PUT; falls back to the backend multipart endpoint (501 = no S3). */
export async function uploadMedia(file: PickedFile, dirName = 'media'): Promise<string> {
  try {
    const { data: presign } = await api.post<PresignResponse>('upload/presign/', {
      filename: file.name,
      content_type: file.mimeType,
      dir_name: dirName,
    });
    const blob = await (await fetch(file.uri)).blob();
    await axios.put(presign.upload_url, blob, { headers: presign.headers });
    return presign.file_url;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 501) throw error;
  }

  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
  form.append('dir_name', dirName);
  const { data } = await api.post<UploadResponse>('upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.file_url;
}
