import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cardId } = await req.json();
    if (!cardId) throw new Error("Missing cardId");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing
    const { data: existing } = await supabase
      .from("cards")
      .select("local_image_url")
      .eq("id", cardId)
      .single();

    if (existing?.local_image_url) {
      return new Response(JSON.stringify({ url: existing.local_image_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Download from YGOPRODeck
    const imageUrl = `https://images.ygoprodeck.com/images/cards/${cardId}.jpg`;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch from YGOPRODeck");
    const imageBlob = await response.blob();

    // Upload to Storage
    const fileName = `${cardId}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("ygo-images")
      .upload(fileName, imageBlob, { contentType: "image/jpeg", upsert: true });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("ygo-images").getPublicUrl(fileName);
    const localImageUrl = publicUrlData.publicUrl;

    // Save to DB
    await supabase.from("cards").upsert({ id: cardId, local_image_url: localImageUrl });

    return new Response(JSON.stringify({ url: localImageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
