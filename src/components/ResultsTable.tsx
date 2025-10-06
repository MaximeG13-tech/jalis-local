import { Business } from '@/types/business';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Phone, Globe } from 'lucide-react';

interface ResultsTableProps {
  businesses: Business[];
}

export const ResultsTable = ({ businesses }: ResultsTableProps) => {
  if (businesses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résultats de la recherche</CardTitle>
        <CardDescription>
          {businesses.length} entreprise{businesses.length > 1 ? 's' : ''} trouvée{businesses.length > 1 ? 's' : ''} avec téléphone et site web
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nom</TableHead>
                <TableHead className="w-[250px]">Adresse</TableHead>
                <TableHead className="w-[150px]">Téléphone</TableHead>
                <TableHead className="w-[200px]">Site web</TableHead>
                <TableHead className="w-[100px]">Google Maps</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{business.nom}</TableCell>
                  <TableCell className="text-sm">{business.adresse}</TableCell>
                  <TableCell>
                    <a
                      href={`tel:${business.telephone}`}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      <span className="text-sm">{business.telephone}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <a
                      href={business.site_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      <span className="text-sm truncate max-w-[180px]">
                        {business.site_web.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <a
                      href={business.lien_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
