import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Percent, BadgeEuro, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { categories } from '@/data/products';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  product_id: string | null;
  category: string | null;
  restaurant: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
}

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as string,
    discount_value: '',
    product_id: '',
    category: '',
    restaurant: 'all',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement des promotions');
      console.error(error);
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name')
      .order('name');
    
    setProducts(data || []);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      product_id: '',
      category: '',
      restaurant: 'all',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setEditingPromotion(null);
  };

  const openEditDialog = (promo: Promotion) => {
    setEditingPromotion(promo);
    setFormData({
      name: promo.name,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      product_id: promo.product_id || '',
      category: promo.category || '',
      restaurant: promo.restaurant,
      start_date: promo.start_date.split('T')[0],
      end_date: promo.end_date.split('T')[0],
      is_active: promo.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const promoData = {
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      product_id: formData.product_id || null,
      category: formData.category || null,
      restaurant: formData.restaurant,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: formData.is_active,
    };

    if (editingPromotion) {
      const { error } = await supabase
        .from('promotions')
        .update(promoData)
        .eq('id', editingPromotion.id);

      if (error) {
        toast.error('Erreur lors de la mise à jour');
        console.error(error);
      } else {
        toast.success('Promotion mise à jour');
        fetchPromotions();
        setIsDialogOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('promotions')
        .insert([promoData]);

      if (error) {
        toast.error('Erreur lors de la création');
        console.error(error);
      } else {
        toast.success('Promotion créée');
        fetchPromotions();
        setIsDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) return;

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    } else {
      toast.success('Promotion supprimée');
      fetchPromotions();
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: !currentValue })
      .eq('id', id);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
    } else {
      setPromotions(prev => prev.map(p => 
        p.id === id ? { ...p, is_active: !currentValue } : p
      ));
    }
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return '-';
    return products.find(p => p.id === productId)?.name || '-';
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const isPromotionActive = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return promo.is_active && now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Gestion des Promotions</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la promotion *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Happy Hour, Offre du jour..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discount_type">Type de remise *</Label>
                      <Select
                        value={formData.discount_type}
                        onValueChange={(value: 'percentage' | 'fixed') => 
                          setFormData(prev => ({ ...prev, discount_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4" />
                              Pourcentage (%)
                            </div>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <div className="flex items-center gap-2">
                              <BadgeEuro className="w-4 h-4" />
                              Montant fixe (€)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount_value">
                        Valeur {formData.discount_type === 'percentage' ? '(%)' : '(€)'} *
                      </Label>
                      <Input
                        id="discount_value"
                        type="number"
                        step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                        max={formData.discount_type === 'percentage' ? '100' : undefined}
                        value={formData.discount_value}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_id">Produit spécifique</Label>
                      <Select
                        value={formData.product_id || 'none'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value === 'none' ? '' : value, category: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les produits" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tous les produits</SelectItem>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Ou catégorie</Label>
                      <Select
                        value={formData.category || 'none'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === 'none' ? '' : value, product_id: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Toutes les catégories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="restaurant">Restaurant</Label>
                    <Select
                      value={formData.restaurant}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les restaurants</SelectItem>
                        <SelectItem value="Cugnaux">Cugnaux</SelectItem>
                        <SelectItem value="Toulouse">Toulouse</SelectItem>
                        <SelectItem value="Foodtruck">Foodtruck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Date de début *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Date de fin *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="is_active">Promotion active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingPromotion ? 'Mettre à jour' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Remise</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune promotion
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {promo.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {promo.discount_value}%
                            </>
                          ) : (
                            <>
                              <BadgeEuro className="w-3 h-3" />
                              {promo.discount_value}€
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {promo.product_id ? (
                          <span className="text-sm">{getProductName(promo.product_id)}</span>
                        ) : promo.category ? (
                          <span className="text-sm">{getCategoryName(promo.category)}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Tous</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(promo.start_date), 'dd/MM', { locale: fr })} - {format(new Date(promo.end_date), 'dd/MM', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={promo.is_active}
                            onCheckedChange={() => toggleActive(promo.id, promo.is_active)}
                          />
                          {isPromotionActive(promo) && (
                            <Badge className="text-xs bg-green-500">En cours</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(promo)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(promo.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionsManagement;
