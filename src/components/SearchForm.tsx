import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

interface SearchFormProps {
  onSearch: (address: string, maxResults: number) => void;
  isLoading: boolean;
}

export const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [address, setAddress] = useState('');
  const [maxResults, setMaxResults] = useState('20');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSearch(address, parseInt(maxResults));
  };

  return (
    <Card className="border-2 border-primary/10 shadow-elegant backdrop-blur-sm bg-card/80">
      <CardContent className="pt-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address" className="text-base font-semibold">Adresse ou nom de l'entreprise</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: 1 Place du Capitole, Toulouse ou Le Capitole Restaurant"
              disabled={isLoading}
              required
              className="h-12 text-base"
            />
            <p className="text-sm text-muted-foreground">
              💡 Vous pouvez saisir une adresse complète ou simplement le nom d'une entreprise
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxResults" className="text-base font-semibold">Nombre d'entreprises à générer</Label>
            <Select value={maxResults} onValueChange={setMaxResults} disabled={isLoading}>
              <SelectTrigger id="maxResults" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 entreprises</SelectItem>
                <SelectItem value="20">20 entreprises</SelectItem>
                <SelectItem value="50">50 entreprises</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all shadow-elegant" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Générer la liste
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
