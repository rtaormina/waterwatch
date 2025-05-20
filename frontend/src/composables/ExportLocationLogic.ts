import { ref, onMounted, computed } from "vue";
import axios from "axios";

export function useLocations() {
  // --- Reactive state ---
  const continents = ref<string[]>([]);
  const countriesByContinent = ref<Record<string, string[]>>({});
  const selectedContinents = ref<string[]>([]);
  const selectedCountries = ref<string[]>([]);

  // --- Derived state ---
  const allCountries = computed(() =>
    selectedContinents.value.flatMap(
      (c) => countriesByContinent.value[c] || []
    )
  );

  const continentPlaceholder = computed(() =>
    selectedContinents.value.length ? "" : "Select continents"
  );
  const countryPlaceholder = computed(() =>
    selectedCountries.value.length ? "" : "Select countries"
  );

  // --- Load data ---
  async function load() {
    const { data } = await axios.get<Record<string, string[]>>(
      "/api/locations/"
    );
    continents.value = Object.keys(data);
    countriesByContinent.value = data;
  }
  onMounted(load);

  // --- Toggle logic ---
  function toggleContinent(continent: string) {
    const idx = selectedContinents.value.indexOf(continent);
    if (idx > -1) {
      selectedContinents.value = selectedContinents.value.filter(
        (c) => c !== continent
      );
    } else {
      selectedContinents.value = [
        ...selectedContinents.value,
        continent,
      ];
    }
  }

  function toggleCountry(country: string) {
    const idx = selectedCountries.value.indexOf(country);
    if (idx > -1) {
      selectedCountries.value = selectedCountries.value.filter(
        (c) => c !== country
      );
    } else {
      selectedCountries.value = [...selectedCountries.value, country];
    }
  }

  function toggleAllContinents() {
    if (selectedContinents.value.length) {
      selectedContinents.value = [];
    } else {
      selectedContinents.value = [...continents.value];
    }
  }

  function toggleAllCountries() {
    if (selectedCountries.value.length) {
      selectedCountries.value = [];
    } else {
      selectedCountries.value = [...allCountries.value];
    }
  }

  // --- Display formatting ---
  function formatContinentSelectionText() {
    const n = selectedContinents.value.length;
    if (n === 0) return "";
    if (n === 1) return selectedContinents.value[0];
    return `${n} continents selected`;
  }

  function formatCountrySelectionText() {
    const n = selectedCountries.value.length;
    if (n === 0) return "";
    if (n === 1) return selectedCountries.value[0];
    return `${n} countries selected`;
  }

  return {
    // data
    continents,
    countriesByContinent,
    selectedContinents,
    selectedCountries,
    allCountries,

    // placeholders
    continentPlaceholder,
    countryPlaceholder,

    // actions
    load,
    toggleContinent,
    toggleCountry,
    toggleAllContinents,
    toggleAllCountries,

    // formatters
    formatContinentSelectionText,
    formatCountrySelectionText,
  };
}
