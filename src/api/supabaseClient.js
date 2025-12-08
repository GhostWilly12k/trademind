import { createClient } from '@supabase/supabase-js';

// Environment variables
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
        const { data, error } = await supabase
          .from('trades')
          .select('*')
          .order('entry_date', { ascending: false });
        if (error) throw error;
        return data;
      },
      async create(tradeData) {
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
        const { data, error } = await supabase
          .from('watchlist')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      async create(itemData) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('watchlist')
          .insert([{ ...itemData, user_id: user.id }])
          .select();
        if (error) throw error;
        return data[0];
      },
      async update(id, updates) {
        const { data, error } = await supabase
          .from('watchlist')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data[0];
      },
      async delete(id) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
    },
  },
  integrations: {
    // NEW: List available models from Edge Function
    async listModels() {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/analyze-trade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'list_models' })
        });
        
        if (!response.ok) return ['gemini-pro']; // Fallback if offline
        const data = await response.json();
        return data.models || ['gemini-pro'];
      } catch (err) {
        console.warn("Model list fetch failed", err);
        return ['gemini-pro'];
      }
    },

    // FIXED: Manual fetch implementation for total control over Body/Headers
    async invokeAIAnalysis(prompt, contextData, model = 'gemini-pro') {
      // 1. Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabaseAnonKey;

      // 2. Construct URL
      const functionUrl = `${supabaseUrl}/functions/v1/analyze-trade`;

      // 3. Manual Fetch
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // IMPORTANT: Flatten the structure so Edge Function gets { trades, watchlist } at root
        body: JSON.stringify({
          trades: contextData.trades || [],
          watchlist: contextData.watchlist || "",
          model: model // Pass selected model
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge Function Failed:", errorText);
        // Try to parse JSON error if possible
        try {
           const jsonError = JSON.parse(errorText);
           throw new Error(jsonError.error || "AI Analysis Failed");
        } catch (e) {
           throw new Error(`AI Analysis Failed: ${response.statusText}`);
        }
      }

      return await response.json();
    }
  }
};