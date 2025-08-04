-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true);

-- Create policies for menu item images
CREATE POLICY "Anyone can view menu item images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu item images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own menu item images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own menu item images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'menu-images' AND auth.role() = 'authenticated');