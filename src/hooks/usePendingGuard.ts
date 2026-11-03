'use client';

import { useState } from 'react';
import { createPendingGuard, type PendingGuard } from '@/lib/log/pending';

/** A PendingGuard for one component, and whether its task is pending, for rendering. */
export function usePendingGuard(): [boolean, PendingGuard] {
  const [pending, setPending] = useState(false);
  const [guard] = useState(() => createPendingGuard(setPending));
  return [pending, guard];
}
