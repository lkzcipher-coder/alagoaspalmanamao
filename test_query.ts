import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

async function test() {
  const { data, error } = await supabase.from('partners').select(`
    *, 
    partner_stats (media_nota, total_avaliacoes),
    avaliacoes (
      id,
      nota,
      comentario,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url
      )
    )
  `)
  
  if (error) {
    console.error("Query Error:", JSON.stringify(error, null, 2))
  } else {
    console.log("Data count:", data?.length)
    if (data && data.length > 0) {
      console.log("First partner:", data[0].name)
    }
  }
}

test()
