import Cookies from "universal-cookie";
import { toValue, type MaybeRefOrGetter } from "vue";
import { saveAs } from "file-saver";
import { useSearch } from "./useSearch";
import type { MeasurementSearchParams } from "./useSearch";

export function useExportData() {
  const cookies = new Cookies();

  async function exportData(format: MaybeRefOrGetter, filters?: MeasurementSearchParams) {
    // flatten whatever filters were given (or empty object)
    const flat = filters ? useSearch().flattenSearchParams(filters) : {};
    const params = new URLSearchParams(flat as any);

    // always include format
    params.append("format", toValue(format));

    const url = `/api/measurements/?${params.toString()}`;
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { "X-CSRFToken": cookies.get("csrftoken") },
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      saveAs(blob, `water-data.${toValue(format)}`);
      return true;
    } catch {
      return false;
    }
  }

  return {
    exportData,
  };
}
