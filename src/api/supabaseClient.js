import { createClient } from '@supabase/supabase-js';

// Environment variables from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service Layer that mimics your old Base44 structure.
 * This makes refactoring your components easier.
 */
export const api = {
  auth: {
    async me() {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    async signIn(email, password) {
      return supabase.auth.signInWithPassword({ email, password });
    },
    async signOut() {
      return supabase.auth.signOut();
    }
  },
  entities: {
    trade: {
      async list() {
        // Equivalent to base44.entities.Trade.list()
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .order('entry_date', { ascending: false });
        if (error) throw error;
        return data;
      },
      async create(tradeData) {
        // Get current user ID first
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from('trades')
          .insert([{ ...tradeData, user_id: user.id }])
          .select();
        if (error) throw error;
        return data[0];
      },
      async update(id, updates) {
        const { data, error } = await supabase
          .from('trades')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data[0];
      },
      async delete(id) {
        const { error } = await supabase
          .from('trades')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
    },
    watchlist: {
      async list() {
        const { data, error } = await supabase.from('watchlist').select('*');
        if (error) throw error;
        return data;
      }
    }
  },
  integrations: {
    // Replacement for InvokeLLM using Supabase Edge Functions
    async invokeAIAnalysis(prompt, contextData) {
      const { data, error } = await supabase.functions.invoke('analyze-trade', {
        body: { prompt, contextData }
      });
      if (error) throw error;
      return data;
    }
  }
};