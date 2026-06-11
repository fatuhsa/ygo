-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id integer PRIMARY KEY,
  local_image_url text NOT NULL
);

-- Enable RLS
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Public read access for cards table
CREATE POLICY "Public read cards" ON cards FOR SELECT USING (true);

-- Storage bucket setup
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ygo-images', 'ygo-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to ygo-images
CREATE POLICY "Public read images" ON storage.objects FOR SELECT USING (bucket_id = 'ygo-images');
