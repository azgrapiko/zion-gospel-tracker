import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Project URL mula sa iyong Supabase Dashboard
const supabaseUrl = 'https://tmvaxkdnitisjqzyzpyf.supabase.co';

// Ang iyong Legacy Anon/Public Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdmF4a2RuaXRpc2pxenl6cHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MjkyMTIsImV4cCI6MjA5MzIwNTIxMn0.Y8n156xyArjHVDg9EldW-RLRgoI3_Aeji9d3UBxZxqo';

// Initializing the Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey);