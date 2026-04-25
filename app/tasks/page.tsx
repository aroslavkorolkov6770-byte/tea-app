"use client";
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ShiftPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: t } = await supabase.from('tasks').select('*');
      if (t) setTasks(t);
      const { data: p } = await supabase.from('lesson_progress').select('lesson_id');
      if (p) setCompletedLessons(p.map(i => i.lesson_id));
    };
    fetchData();
  }, []);

  return (
    <div style={{ backgroundColor: '#0d0f0d', minHeight: '100vh', color: '#e0e0e0' } as any}>
      <Navigation />
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 25px' } as any}>
        <h2 style={{fontSize: '28px'}}>Рабочая смена 📋</h2>
        {/* Контент смены будет подгружаться из Supabase */}
      </main>
    </div>
  );
}