interface PriceDisplayProps {
  precio: number;
  moneda: string;
  className?: string;
}

export function formatPrice(precio: number, moneda: string) {
  return moneda === "USD"
    ? `USD ${precio.toLocaleString("es-AR")}`
    : `$ ${precio.toLocaleString("es-AR")}`;
}

export function PriceDisplay({ precio, moneda, className }: PriceDisplayProps) {
  return (
    <p className={`text-xl font-bold text-centa-green-1 ${className ?? ""}`}>
      {formatPrice(precio, moneda)}
    </p>
  );
}
