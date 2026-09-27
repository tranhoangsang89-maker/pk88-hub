import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kvxxkfgictaqmwcwvluf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eHhrZmdpY3RhcW13Y3d2bHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTExNTYsImV4cCI6MjEwNjA4NzE1Nn0.2_DlkAogz1dmdPs2lnozj4hSxekY7gmmtT2X_NGs7NQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
