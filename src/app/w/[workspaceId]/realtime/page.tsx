'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Visit {
  id: string;
  domain: string;
  path: string;
  crawler_name: string;
  timestamp: string;
}

export default function RealtimeVisits({ params }: { params: { workspaceId: string } }) {
  const { workspaceId } = params;
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`workspace-${workspaceId}`);

    channel
      .on('broadcast', { event: 'new_visit' }, (payload) => {
        console.log('New visit received!', payload);
        setVisits((prevVisits) => [...prevVisits, payload.payload.visit]);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to workspace-${workspaceId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Real-time Crawler Visits for Workspace: {workspaceId}</h1>
      <ul className="space-y-2">
        {visits.map((visit) => (
          <li key={visit.id} className="p-4 bg-gray-100 rounded-lg">
            <p><strong>Crawler:</strong> {visit.crawler_name}</p>
            <p><strong>Path:</strong> {visit.domain}{visit.path}</p>
            <p><strong>Time:</strong> {new Date(visit.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
