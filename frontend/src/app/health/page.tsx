'use client';

import { useEffect, useState } from 'react';

export default function HealthPage() {
  const [status, setStatus] = useState('loading...');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/health`);
        const data = await res.json();
        setStatus(data.status);
      } catch (error) {
        setStatus('error');
      }
    };

    fetchHealth();
  }, []);

  return (
    <div>
      <h1>Backend Status: {status}</h1>
    </div>
  );
}