import { useQuery } from '@tanstack/react-query';
import { getIngestStatus } from '../ingest';
import type { IngestStatus } from '../types';

export const ingestQueryKeys = {
  status: ['ingest-status'] as const,
};

export function useIngestStatus() {
  return useQuery<IngestStatus>({
    queryKey: ingestQueryKeys.status,
    queryFn: getIngestStatus,
  });
}
