import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Filter, X, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { fetchLines, fetchCompanies, LineData, CompanyData } from "@/services/filtersApi";
import { getClienteLocalStorage } from "@/services/auth";
import { useTranslation } from "@/hooks/useTranslation";

interface VehicleFiltersPanelProps {
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  onLineChange: (line: string | null) => void;
  onCompanyChange: (company: number | null) => void;
  selectedDateRange: { start: Date | null; end: Date | null };
  selectedLine: string | null;
  selectedCompany: number | null;
}

export const VehicleFiltersPanel = ({
  onDateRangeChange,
  onLineChange,
  onCompanyChange,
  selectedDateRange,
  selectedLine,
  selectedCompany,
}: VehicleFiltersPanelProps) => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: selectedDateRange.start || undefined,
    to: selectedDateRange.end || undefined,
  });
  
  // Local state for filters before applying them
  const [tempSelectedLine, setTempSelectedLine] = useState<string | null>(selectedLine);
  const [tempSelectedCompany, setTempSelectedCompany] = useState<number | null>(selectedCompany);
  
  const [lines, setLines] = useState<LineData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loadingLines, setLoadingLines] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Atualizar dateRange quando selectedDateRange mudar
  useEffect(() => {
    setDateRange({
      from: selectedDateRange.start || undefined,
      to: selectedDateRange.end || undefined,
    });
  }, [selectedDateRange.start, selectedDateRange.end]);

  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const cliente = getClienteLocalStorage();
        
        // Only try to fetch if we have a valid client ID
        if (cliente.idCliente && cliente.idCliente > 0) {
          const [linesData, companiesData] = await Promise.all([
            fetchLines().catch(() => []),
            fetchCompanies(cliente.idCliente?.toString() || "0").catch(() => [])
          ]);
          
          setLines(Array.isArray(linesData) ? linesData : []);
          setCompanies(Array.isArray(companiesData) ? companiesData : []);
        } else {
          setLines([]);
          setCompanies([]);
        }
      } catch (error) {
        setLines([]);
        setCompanies([]);
      } finally {
        setLoadingLines(false);
        setLoadingCompanies(false);
      }
    };

    loadFiltersData();
  }, []);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    // Don't apply immediately - wait for user to click "Consultar"
  };

  const handleSearch = () => {
    // Apply all filters when user clicks "Consultar"
    onDateRangeChange(dateRange?.from || null, dateRange?.to || null);
    onLineChange(tempSelectedLine);
    onCompanyChange(tempSelectedCompany);
  };

  const clearAllFilters = () => {
    setDateRange(undefined);
    setTempSelectedLine(null);
    setTempSelectedCompany(null);
    onDateRangeChange(null, null);
    onLineChange(null);
    onCompanyChange(null);
  };

  const activeFiltersCount = 
    (dateRange?.from || dateRange?.to ? 1 : 0) +
    (tempSelectedLine ? 1 : 0) +
    (tempSelectedCompany ? 1 : 0);

  return (
    <Card className="backdrop-blur-sm bg-card/80 border mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-card-foreground">{t('dashboard.filters.title')}</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-card-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {t('dashboard.filters.clear')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Line Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">{t('dashboard.filters.line')}</label>
            <Select
              value={tempSelectedLine || "all"}
              onValueChange={(value) => setTempSelectedLine(value === "all" ? null : value)}
              disabled={loadingLines}
            >
              <SelectTrigger className="bg-background border-border">
                {loadingLines ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <SelectValue placeholder={t('dashboard.filters.allLines')} />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.filters.allLines')}</SelectItem>
                {lines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.descr || line.nome || line.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">{t('dashboard.filters.company')}</label>
            <Select
              value={tempSelectedCompany?.toString() || "all"}
              onValueChange={(value) => setTempSelectedCompany(value === "all" ? null : parseInt(value))}
              disabled={loadingCompanies}
            >
              <SelectTrigger className="bg-background border-border">
                {loadingCompanies ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <SelectValue placeholder={t('dashboard.filters.allCompanies')} />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.filters.allCompanies')}</SelectItem>
                {companies
                  .filter(company => company.empresaId != null) 
                  .map((company) => (
                  <SelectItem key={company.empresaId} value={company.empresaId.toString()}>
                    {company.nomeEmpresa || company.razaoSocial || `${t('dashboard.filters.company')} ${company.empresaId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-card-foreground">{t('dashboard.filters.period')}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-background border-border"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>{t('dashboard.filters.selectPeriod')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={activeFiltersCount === 0}
            className="text-muted-foreground hover:text-card-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
          <Button
            onClick={handleSearch}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Search className="h-4 w-4 mr-2" />
            Consultar
          </Button>
        </div>
      </div>
    </Card>
  );
};