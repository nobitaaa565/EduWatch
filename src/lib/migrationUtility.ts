import { supabase } from './supabase';

export const migrationUtility = {
  async exportData(): Promise<string> {
    const backup: Record<string, any[]> = {};

    try {
      const { data } = await supabase.from('users').select('*');
      backup['users'] = data || [];
    } catch (e) {
      console.warn("Failed to export users:", e);
      backup['users'] = [];
    }

    try {
      const { data: posts } = await supabase.from('posts').select('*');
      backup['posts'] = posts || [];

      const { data: comments } = await supabase.from('comments').select('*');
      backup['comments'] = comments || [];
    } catch (e) {
      console.warn("Failed to export posts:", e);
      backup['posts'] = [];
    }

    try {
      const { data: follows } = await supabase.from('follows').select('*');
      backup['follows'] = follows || [];
    } catch (e) {
      backup['follows'] = [];
    }

    return JSON.stringify(backup, null, 2);
  },

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    for (const [table, rows] of Object.entries(data)) {
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const { error } = await supabase.from(table).upsert(rows, {
          onConflict: 'id',
          ignoreDuplicates: false,
        });
        if (error) console.warn(`Error importing ${table}:`, error);
      }
    }
  },
};
