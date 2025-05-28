import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://fmxbdmgkaggducevbbxf.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteGJkbWdrYWdnZHVjZXZiYnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjEwODcsImV4cCI6MjA2MzkzNzA4N30.bNqcdMrbZofXEkGiQOxV6W-tTQlNtNlnGAq8f6UUHt4"

export const supabase = createClient(supabaseUrl, supabaseKey)
