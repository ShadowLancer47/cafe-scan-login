import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowLeft, Save, X } from "lucide-react";

interface Cafe {
  id: string;
  name: string;
  description: string;
  location: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
  sort_order: number;
  image_url?: string;
}

interface MenuManagerProps {
  cafe: Cafe;
  onBack: () => void;
}

const MenuManager = ({ cafe, onBack }: MenuManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    image: null as File | null,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    image: null as File | null,
    currentImageUrl: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, [cafe.id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("cafe_id", cafe.id)
        .order("sort_order");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("menu_categories")
        .insert([
          {
            ...categoryForm,
            cafe_id: cafe.id,
            sort_order: categories.length,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully!",
      });

      setCategoryForm({ name: "", description: "" });
      setShowCategoryForm(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let image_url = null;

      // Upload image if provided
      if (itemForm.image) {
        const fileExt = itemForm.image.name.split('.').pop();
        const fileName = `${cafe.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, itemForm.image);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      const { error } = await supabase
        .from("menu_items")
        .insert([
          {
            name: itemForm.name,
            description: itemForm.description,
            price: parseFloat(itemForm.price),
            category_id: itemForm.category_id,
            is_available: itemForm.is_available,
            image_url,
            sort_order: menuItems.filter(item => item.category_id === itemForm.category_id).length,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item created successfully!",
      });

      setItemForm({
        name: "",
        description: "",
        price: "",
        category_id: "",
        is_available: true,
        image: null,
      });
      setShowItemForm(false);
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCategoryItems = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const startEditingItem = (item: MenuItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id,
      is_available: item.is_available,
      image: null,
      currentImageUrl: item.image_url || "",
    });
  };

  const cancelEditingItem = () => {
    setEditingItem(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      category_id: "",
      is_available: true,
      image: null,
      currentImageUrl: "",
    });
  };

  const updateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      let image_url = editForm.currentImageUrl;

      // Upload new image if provided
      if (editForm.image) {
        // Delete old image if exists
        if (editForm.currentImageUrl) {
          const oldPath = editForm.currentImageUrl.split('/menu-images/')[1];
          if (oldPath) {
            await supabase.storage.from('menu-images').remove([oldPath]);
          }
        }

        const fileExt = editForm.image.name.split('.').pop();
        const fileName = `${cafe.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, editForm.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName);
        
        image_url = publicUrl;
      }

      const { error } = await supabase
        .from("menu_items")
        .update({
          name: editForm.name,
          description: editForm.description,
          price: parseFloat(editForm.price),
          category_id: editForm.category_id,
          is_available: editForm.is_available,
          image_url,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item updated successfully!",
      });

      cancelEditingItem();
      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMenuItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      // Delete image from storage if exists
      if (item.image_url) {
        const imagePath = item.image_url.split('/menu-images/')[1];
        if (imagePath) {
          await supabase.storage.from('menu-images').remove([imagePath]);
        }
      }

      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully!",
      });

      fetchMenuItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div>Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{cafe.name}</h1>
          <p className="text-muted-foreground">Menu Management</p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Menu Categories</h2>
            <Button onClick={() => setShowCategoryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {showCategoryForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Category Name *</Label>
                    <Input
                      id="categoryName"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Appetizers, Main Courses, Desserts"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this category"
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Category</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCategoryForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {categories.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first menu category to organize your items.
                  </p>
                </CardContent>
              </Card>
            ) : (
              categories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        {getCategoryItems(category.id).length} items
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Menu Items</h2>
            <Button 
              onClick={() => setShowItemForm(true)}
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {categories.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No categories available</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You need to create at least one category before adding menu items.
                </p>
              </CardContent>
            </Card>
          )}

          {showItemForm && categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Menu Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createMenuItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemName">Item Name *</Label>
                      <Input
                        id="itemName"
                        value={itemForm.name}
                        onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Caesar Salad"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="itemPrice">Price *</Label>
                      <Input
                        id="itemPrice"
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="12.99"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemCategory">Category *</Label>
                    <select
                      id="itemCategory"
                      value={itemForm.category_id}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemDescription">Description</Label>
                    <Textarea
                      id="itemDescription"
                      value={itemForm.description}
                      onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Fresh romaine lettuce with parmesan cheese and croutons..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemImage">Image</Label>
                    <Input
                      id="itemImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setItemForm(prev => ({ ...prev, image: file }));
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload an image of your menu item (optional)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Create Item</Button>
                    <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {categories.map((category) => {
              const categoryItems = getCategoryItems(category.id);
              return (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold mb-3">{category.name}</h3>
                  {categoryItems.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <p className="text-muted-foreground">No items in this category yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {categoryItems.map((item) => (
                        <Card key={item.id}>
                          {editingItem?.id === item.id ? (
                            <CardContent className="p-4">
                              <form onSubmit={updateMenuItem} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-name-${item.id}`}>Item Name *</Label>
                                    <Input
                                      id={`edit-name-${item.id}`}
                                      value={editForm.name}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`edit-price-${item.id}`}>Price *</Label>
                                    <Input
                                      id={`edit-price-${item.id}`}
                                      type="number"
                                      step="0.01"
                                      value={editForm.price}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-category-${item.id}`}>Category *</Label>
                                  <select
                                    id={`edit-category-${item.id}`}
                                    value={editForm.category_id}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, category_id: e.target.value }))}
                                    className="w-full p-2 border border-input rounded-md bg-background"
                                    required
                                  >
                                    {categories.map((category) => (
                                      <option key={category.id} value={category.id}>
                                        {category.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-description-${item.id}`}>Description</Label>
                                  <Textarea
                                    id={`edit-description-${item.id}`}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`edit-image-${item.id}`}>Change Image</Label>
                                  {editForm.currentImageUrl && (
                                    <div className="mb-2">
                                      <img
                                        src={editForm.currentImageUrl}
                                        alt="Current image"
                                        className="w-20 h-20 object-cover rounded-md"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">Current image</p>
                                    </div>
                                  )}
                                  <Input
                                    id={`edit-image-${item.id}`}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setEditForm(prev => ({ ...prev, image: file }));
                                    }}
                                    className="cursor-pointer"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Upload a new image to replace the current one (optional)
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`edit-available-${item.id}`}
                                    checked={editForm.is_available}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, is_available: e.target.checked }))}
                                  />
                                  <Label htmlFor={`edit-available-${item.id}`}>Available</Label>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="submit" size="sm">
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button type="button" variant="outline" size="sm" onClick={cancelEditingItem}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            </CardContent>
                          ) : (
                            <CardContent className="flex gap-4 p-4">
                              {item.image_url && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover rounded-md"
                                  />
                                </div>
                              )}
                              <div className="flex-1 flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium">{item.name}</h4>
                                    {!item.is_available && (
                                      <Badge variant="destructive">Unavailable</Badge>
                                    )}
                                  </div>
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-lg font-semibold">
                                    ${item.price.toFixed(2)}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditingItem(item)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteMenuItem(item)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MenuManager;