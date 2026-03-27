import { useQuery } from '@tanstack/react-query';
import { getIngestStatus } from '../ingest';
import type { IngestStatus } from '../types';

/**
 * CSV 적재 상태 조회 쿼리.
 * 월별 적재 현황 및 진행 상태를 제공한다.
 */
export const IngestQuery = {
  keys: {
    status: ['ingest-status'] as const,
  },

  /** 전체 적재 현황 조회. */
  useIngestStatus() {
    return useQuery<IngestStatus>({
      queryKey: IngestQuery.keys.status,
      queryFn: getIngestStatus,
    });
  },
};
