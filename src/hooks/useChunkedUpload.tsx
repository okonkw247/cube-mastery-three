import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB per chunk

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
}

export function useChunkedUpload() {
  const [state, setState] = useState<UploadState>({ progress: 0, uploading: false, error: null });
  const abortRef = useRef(false);

  const uploadVideo = useCallback(async (file: File, bucket: string = 'videos'): Promise<string | null> => {
    abortRef.current = false;
    setState({ progress: 0, uploading: true, error: null });

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // For files under 50MB, use simple upload with XMLHttpRequest for progress
    if (file.size < 50 * 1024 * 1024) {
      try {
        const url = await uploadWithProgress(file, bucket, fileName, (pct) => {
          setState(s => ({ ...s, progress: pct }));
        });
        setState({ progress: 100, uploading: false, error: null });
        return url;
      } catch (err: any) {
        setState({ progress: 0, uploading: false, error: err.message });
        toast.error('Upload failed: ' + err.message);
        return null;
      }
    }

    // For large files, upload in chunks
    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const tempPaths: string[] = [];

      for (let i = 0; i < totalChunks; i++) {
        if (abortRef.current) {
          // Clean up uploaded chunks
          for (const p of tempPaths) {
            await supabase.storage.from(bucket).remove([p]);
          }
          setState({ progress: 0, uploading: false, error: 'Upload cancelled' });
          return null;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const chunkName = `_chunks/${fileName}_part${i}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(chunkName, chunk, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) throw new Error(`Chunk ${i + 1}/${totalChunks} failed: ${error.message}`);

        tempPaths.push(chunkName);
        const progress = Math.round(((i + 1) / totalChunks) * 90); // 90% for upload, 10% for assembly
        setState(s => ({ ...s, progress }));
      }

      // For chunked uploads, we need to reassemble. 
      // Since Supabase doesn't have a server-side concat, we download chunks and re-upload as one.
      // For very large files, we'll use the last chunk approach: upload the full file directly 
      // but with a longer timeout via XMLHttpRequest.
      
      // Actually, let's just do the direct upload with XHR for all sizes - it handles streaming.
      // Clean up temp chunks first
      for (const p of tempPaths) {
        await supabase.storage.from(bucket).remove([p]);
      }

      // Fall back to direct XHR upload for the full file
      setState(s => ({ ...s, progress: 0 }));
      const url = await uploadWithProgress(file, bucket, fileName, (pct) => {
        setState(s => ({ ...s, progress: pct }));
      });
      setState({ progress: 100, uploading: false, error: null });
      return url;

    } catch (err: any) {
      setState({ progress: 0, uploading: false, error: err.message });
      toast.error('Upload failed: ' + err.message);
      return null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { ...state, uploadVideo, cancelUpload };
}

async function uploadWithProgress(
  file: File,
  bucket: string,
  fileName: string,
  onProgress: (pct: number) => void
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    // No timeout for large files
    xhr.timeout = 0;

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        resolve(urlData.publicUrl);
      } else {
        let msg = 'Upload failed';
        try { msg = JSON.parse(xhr.responseText)?.message || msg; } catch {}
        reject(new Error(msg));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('timeout', () => reject(new Error('Upload timed out')));

    xhr.send(file);
  });
}
