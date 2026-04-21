import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CsvColumn, downloadCsv, csvTimestamp } from "../../utils/exportCsv";

interface Props<T> {
  label?: string;
  filenamePrefix: string;
  columns: CsvColumn<T>[];
  fetchRows: () => Promise<T[]>;
  disabled?: boolean;
  maxRows?: number;
}

export function ExportCsvButton<T>({
  label = "Exportar CSV",
  filenamePrefix,
  columns,
  fetchRows,
  disabled,
  maxRows = 10_000,
}: Props<T>) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const rows = await fetchRows();
      if (rows.length === 0) {
        toast.info("No hay datos para exportar");
        return;
      }
      const trimmed = rows.length > maxRows ? rows.slice(0, maxRows) : rows;
      downloadCsv(`${filenamePrefix}-${csvTimestamp()}`, trimmed, columns);
      if (rows.length > maxRows) {
        toast.warning(`Export limitado a ${maxRows.toLocaleString()} filas (había ${rows.length.toLocaleString()})`);
      } else {
        toast.success(`${rows.length.toLocaleString()} fila${rows.length !== 1 ? "s" : ""} exportada${rows.length !== 1 ? "s" : ""}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al exportar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 hover:bg-[#222] hover:text-white disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
