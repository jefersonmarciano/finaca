import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://trngajjnwfurgzsecfhk.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmdhampud2Z1cmd6c2VjZmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMjI2ODcsImV4cCI6MjA2Mzg5ODY4N30.UbkPgKwxm5Js292ogk09tb7fwNRM6BhVEVU5F_Ye_m8"

export const supabase = createClient(supabaseUrl, supabaseKey)
