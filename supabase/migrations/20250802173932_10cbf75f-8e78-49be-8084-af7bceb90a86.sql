-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cafes table
CREATE TABLE public.cafes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu categories table
CREATE TABLE public.menu_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for cafes
CREATE POLICY "Users can view their own cafes" 
ON public.cafes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cafes" 
ON public.cafes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cafes" 
ON public.cafes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cafes" 
ON public.cafes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for menu categories
CREATE POLICY "Users can view categories for their cafes" 
ON public.menu_categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE cafes.id = menu_categories.cafe_id 
    AND cafes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create categories for their cafes" 
ON public.menu_categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE cafes.id = menu_categories.cafe_id 
    AND cafes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update categories for their cafes" 
ON public.menu_categories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE cafes.id = menu_categories.cafe_id 
    AND cafes.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete categories for their cafes" 
ON public.menu_categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE cafes.id = menu_categories.cafe_id 
    AND cafes.user_id = auth.uid()
  )
);

-- Create policies for menu items
CREATE POLICY "Users can view items for their cafes" 
ON public.menu_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.cafes c ON c.id = mc.cafe_id
    WHERE mc.id = menu_items.category_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create items for their cafes" 
ON public.menu_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.cafes c ON c.id = mc.cafe_id
    WHERE mc.id = menu_items.category_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items for their cafes" 
ON public.menu_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.cafes c ON c.id = mc.cafe_id
    WHERE mc.id = menu_items.category_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items for their cafes" 
ON public.menu_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.menu_categories mc
    JOIN public.cafes c ON c.id = mc.cafe_id
    WHERE mc.id = menu_items.category_id 
    AND c.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cafes_updated_at
  BEFORE UPDATE ON public.cafes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON public.menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();