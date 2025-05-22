import Cookies from "universal-cookie";
import { ref } from "vue";
import { saveAs } from "file-saver";
import { flattenSearchParams } from "./ExportSearchLogic";
import type { MeasurementSearchParams } from "./ExportSearchLogic";


const format = ref<"csv" | "xml" | "json" | "geojson">("csv");
const cookies = new Cookies();

export { format };

export async function exportData(filters?: MeasurementSearchParams) {
  // flatten whatever filters were given (or empty object)
  console.log(filters?.times)
  const flat = filters ? flattenSearchParams(filters) : {};
  const params = new URLSearchParams(flat as any);

  // 2) always include format
  params.append("format", format.value);

  const url = `/api/measurements/?${params.toString()}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-CSRFToken": cookies.get("csrftoken") },
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    saveAs(blob, `water-data.${format.value}`);
    return true;
  } catch {
    return false;
  }
}
