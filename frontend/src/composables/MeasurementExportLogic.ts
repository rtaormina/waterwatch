import Cookies from "universal-cookie";
import { ref } from "vue";
import { saveAs } from "file-saver"

const format = ref<"csv">("csv");
const cookies = new Cookies();

export { format }

export async function exportData() {
  const url = `/api/export/?format=${format.value}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "X-CSRFToken": cookies.get("csrftoken") },
      credentials: "same-origin",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    saveAs(blob, `water-data.${format.value}`);
  } catch (e) {
    alert("Export failed.");
  }
}
