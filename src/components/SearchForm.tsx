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
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="address">Adresse de recherche</Label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: 1 Place du Capitole, Toulouse"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxResults">Nombre d'entreprises</Label>
            <Select value={maxResults} onValueChange={setMaxResults} disabled={isLoading}>
              <SelectTrigger id="maxResults">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 entreprises</SelectItem>
                <SelectItem value="20">20 entreprises</SelectItem>
                <SelectItem value="50">50 entreprises</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
