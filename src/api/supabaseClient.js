import { createClient } from '@supabase/supabase-js';

// 1. Load and Verify Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "CRITICAL ERROR: Supabase environment variables are missing. Check your .env file."
  );
}

// 2. Factory for Authenticated Clerk Client
// Call this inside your React components using: const { getToken } = useAuth();
export const createClerkSupabaseClient = async (getToken) => {
  const token = await getToken({ template: 'supabase' });

  // Custom header object
  // We EXPLICITLY add 'apikey' to ensure Supabase sees it
  const headers = {
    apikey: supabaseAnonKey,
  };

  // Only add Authorization if we actually have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: headers,
    },
  });
};

// 3. Fallback Client (Unauthenticated / Public)
// Useful for public queries or when the user is not logged in
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Service Layer
 * Updated to accept an authenticated 'client' instance.
 * Defaults to the 'supabase' fallback if not provided.
 */
export const api = {
  // Use useAuth() from Clerk in your components for authentication state.
  // These helpers are for data operations.
  
  entities: {
    profile: {
      // FIX: Now accepts userId explicitly. Do not rely on client.auth.getUser()
      async get(client = supabase, userId) {
        if (!userId) return null;
        
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        // Ignore "Row not found" error (code PGRST116) - just return null
        if (error && error.code !== 'PGRST116') throw error; 
        return data;
      },
      
      // FIX: Updates must include the ID or rely on the caller to know it
      async update(updates, client = supabase) {
        if (!updates.id) throw new Error("Profile ID is required for updates");

        const { data, error } = await client
          .from('profiles')
          .upsert(updates)
          .select();
          
        if (error) throw error;
        return data[0];
      }
    },

    trade: {
      async list(client = supabase) {
        const { data, error } = await client
          .from('trades')
          .select('*')
          .order('entry_date', { ascending: false });
        if (error) throw error;
        return data;
      },
      // FIX: tradeData MUST include 'user_id' from the React component
      async create(tradeData, client = supabase) {
        if (!tradeData.user_id) throw new Error("user_id is missing in tradeData");

        const { data, error } = await client
          .from('trades')
          .insert([tradeData])
          .select();
        if (error) throw error;
        return data[0];
      },
      async update(id, updates, client = supabase) {
        const { data, error } = await client
          .from('trades')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data[0];
      },
      async delete(id, client = supabase) {
        const { error } = await client
          .from('trades')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
    },

    watchlist: {
      async list(client = supabase) {
        const { data, error } = await client
          .from('watchlist')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      // FIX: itemData MUST include 'user_id' from the React component
      async create(itemData, client = supabase) {
        if (!itemData.user_id) throw new Error("user_id is missing in itemData");

        const { data, error } = await client
          .from('watchlist')
          .insert([itemData])
          .select();
        if (error) throw error;
        return data[0];
      },
      async update(id, updates, client = supabase) {
        const { data, error } = await client
          .from('watchlist')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        return data[0];
      },
      async delete(id, client = supabase) {
        const { error } = await client
          .from('watchlist')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
    },
  },

  storage: {
    // FIX: Requires explicit userId argument
    async uploadImage(file, userId, bucket = 'trade-screenshots', client = supabase) {
      if (!userId) throw new Error("User ID is required for file upload path");

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error } = await client.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = client.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    }
  },

  integrations: {
    async listModels(token) {
      const headers = { 'Content-Type': 'application/json' };
      // Explicitly set apikey here as well for direct fetch calls
      headers['apikey'] = supabaseAnonKey;
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/analyze-trade`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'list_models' })
        });
        
        if (!response.ok) return ['gemini-pro']; 
        const data = await response.json();
        return data.models || ['gemini-pro'];
      } catch (err) {
        console.warn("Model list fetch failed", err);
        return ['gemini-pro'];
      }
    },

    async invokeAIAnalysis(prompt, contextData, model = 'gemini-pro', token) {
      const functionUrl = `${supabaseUrl}/functions/v1/analyze-trade`;

      const headers = {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey // Explicitly add apikey
      };
      
      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      } else {
          headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trades: contextData.trades || [],
          watchlist: contextData.watchlist || "",
          model: model 
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Edge Function Failed:", errorText);
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