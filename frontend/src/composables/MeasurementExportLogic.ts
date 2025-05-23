import Cookies from "universal-cookie";
import { ref } from "vue";
import { saveAs } from "file-saver";

const format = ref<"csv" | "xml" | "json" | "geojson">("csv");
const cookies = new Cookies();

export { format };

/**
 * Function to export data in the selected format
 *
 * @returns {Promise<boolean>} true if the export was successful, false otherwise
 */
export async function exportData() {
    const params = new URLSearchParams();
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
