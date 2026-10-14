"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/molecules/property-card";
import type { Currency, Property, PropertyCategory } from "@/types/property";

const tabs: { value: PropertyCategory | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "a-estrenar", label: "A Estrenar" },
  { value: "usado", label: "Usados" },
  { value: "emprendimiento", label: "Emprendimientos" },
];

const ambientesOptions = [
  { value: "todos", label: "Todos" },
  { value: "1", label: "1 ambiente" },
  { value: "2", label: "2 ambientes" },
  { value: "3", label: "3 ambientes" },
  { value: "4+", label: "4+ ambientes" },
];

const currencyOptions: { value: Currency | "todos"; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "USD", label: "USD" },
  { value: "ARS", label: "ARS" },
];

interface CatalogTemplateProps {
  properties: Property[];
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(property: Property, query: string) {
  if (!query) return true;

  const haystack = [
    property.titulo,
    property.descripcion,
    property.ubicacion,
    property.barrio,
    property.ciudad,
    property.operacion ?? "",
    property.categoria,
    property.estado,
  ]
    .map(normalizeText)
    .join(" ");

  return normalizeText(query)
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

function matchesAmbientes(property: Property, ambientes: string) {
  if (ambientes === "todos") return true;
  if (ambientes === "4+") return property.ambientes >= 4;
  return property.ambientes === Number(ambientes);
}

function matchesPrice(property: Property, minPrice: string, maxPrice: string) {
  const min = minPrice ? Number(minPrice) : Number.NEGATIVE_INFINITY;
  const max = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;

  if (!Number.isFinite(min) || !Number.isFinite(max)) return true;
  return property.precio >= min && property.precio <= max;
}

export function CatalogTemplate({ properties }: CatalogTemplateProps) {
  const [activeTab, setActiveTab] = useState<string>("todos");
  const [barrio, setBarrio] = useState<string>("todos");
  const [ambientes, setAmbientes] = useState<string>("todos");
  const [currency, setCurrency] = useState<string>("todos");
  const [operacion, setOperacion] = useState<string>("todos");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [search, setSearch] = useState("");

  const barrios = useMemo(
    () => [...new Set(properties.map((property) => property.barrio).filter(Boolean))].sort(),
    [properties],
  );

  const operaciones = useMemo(
    () => [...new Set(properties.map((property) => property.operacion).filter(Boolean))].sort(),
    [properties],
  );

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      if (activeTab !== "todos" && property.categoria !== activeTab) return false;
      if (barrio !== "todos" && property.barrio !== barrio) return false;
      if (currency !== "todos" && property.moneda !== currency) return false;
      if (operacion !== "todos" && property.operacion !== operacion) return false;
      if (!matchesAmbientes(property, ambientes)) return false;
      if (!matchesPrice(property, minPrice, maxPrice)) return false;
      return matchesSearch(property, search);
    });
  }, [activeTab, ambientes, barrio, currency, maxPrice, minPrice, operacion, properties, search]);

  const hasActiveFilters =
    activeTab !== "todos" ||
    barrio !== "todos" ||
    ambientes !== "todos" ||
    currency !== "todos" ||
    operacion !== "todos" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    search !== "";

  function clearFilters() {
    setActiveTab("todos");
    setBarrio("todos");
    setAmbientes("todos");
    setCurrency("todos");
    setOperacion("todos");
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
  }

  return (
    <div className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/*
        <div>
          <p className="section-eyebrow">Propiedades</p>
          <h1 className="section-title text-balance">Catálogo de propiedades</h1>
          <p className="section-copy mt-2 max-w-2xl">
            Buscá por zona, operación, ambientes, precio o palabras clave de la publicación.
          </p>
          <a
            href="/contacto"
            className="cta-secondary mt-5 h-10 rounded-lg px-4 text-sm font-medium"
          >
            Necesito ayuda para encontrar una propiedad
          </a>
        </div>
        */}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="surface-panel h-auto flex-wrap justify-start gap-2 rounded-2xl border-[var(--color-centa-border-soft)] p-1.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="pill-label min-h-10 border border-[var(--color-centa-border-soft)] bg-transparent px-4 text-[0.7rem] text-centa-green-1 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <section className="surface-panel mt-6 border-[var(--color-centa-border-soft)] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-centa-green-1">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              Buscar propiedades
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
              <label className="flex flex-col gap-1.5 lg:col-span-2">
                <span className="text-sm font-medium text-centa-black">Búsqueda</span>
                <span className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    name="property-search"
                    type="search"
                    autoComplete="off"
                    placeholder="Ej: Palermo 3 ambientes balcón…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-11 border-[var(--color-centa-border-soft)] bg-card pl-9 shadow-none"
                  />
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Zona</span>
                <Select value={barrio} onValueChange={(value) => setBarrio(value ?? "todos")}>
                  <SelectTrigger className="h-11 w-full border-[var(--color-centa-border-soft)] bg-card shadow-none">
                    <SelectValue placeholder="Todas las zonas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas las zonas</SelectItem>
                    {barrios.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Operación</span>
                <Select value={operacion} onValueChange={(value) => setOperacion(value ?? "todos")}>
                  <SelectTrigger className="h-11 w-full border-[var(--color-centa-border-soft)] bg-card shadow-none">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {operaciones.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Ambientes</span>
                <Select value={ambientes} onValueChange={(value) => setAmbientes(value ?? "todos")}>
                  <SelectTrigger className="h-11 w-full border-[var(--color-centa-border-soft)] bg-card shadow-none">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    {ambientesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Moneda</span>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "todos")}>
                  <SelectTrigger className="h-11 w-full border-[var(--color-centa-border-soft)] bg-card shadow-none">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Precio mínimo</span>
                <Input
                  name="min-price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  autoComplete="off"
                  placeholder="Ej: 100000…"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  className="h-11 border-[var(--color-centa-border-soft)] bg-card shadow-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-centa-black">Precio máximo</span>
                <Input
                  name="max-price"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  autoComplete="off"
                  placeholder="Ej: 250000…"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  className="h-11 border-[var(--color-centa-border-soft)] bg-card shadow-none"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-centa-border-soft)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {filtered.length} de {properties.length} propiedades encontradas
              </p>
              {hasActiveFilters && (
                <Button type="button" variant="outline" size="sm" className="pill-label h-10 border-[var(--color-centa-border-soft)] bg-transparent px-4 text-[0.7rem] text-centa-green-1 hover:bg-primary/5" onClick={clearFilters}>
                  <X className="mr-2 size-4" aria-hidden="true" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </section>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-8">
              {filtered.length > 0 ? (
                <div className="grid gap-6 md:gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="surface-panel flex flex-col items-center justify-center px-4 py-20 text-center">
                  <p className="text-lg font-medium text-centa-black">No se encontraron propiedades</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Probá cambiar la zona, el precio o las palabras de búsqueda.
                  </p>
                  <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
