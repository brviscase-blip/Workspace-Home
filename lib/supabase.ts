
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://upplspxysjhocqpvjaek.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcGxzcHh5c2pob2NxcHZqYWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODk4NDQsImV4cCI6MjA4NDg2NTg0NH0._4sM0So7j6X6acLOROzKNKRYsgdqLogtQePq34Pd1ko';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);