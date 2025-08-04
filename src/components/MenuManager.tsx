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
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";

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
      const { error } = await supabase
        .from("menu_items")
        .insert([
          {
            ...itemForm,
            price: parseFloat(itemForm.price),
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
                          <CardContent className="flex justify-between items-start p-4">
                            <div className="flex-1">
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
                            <div className="text-lg font-semibold">
                              ${item.price.toFixed(2)}
                            </div>
                          </CardContent>
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