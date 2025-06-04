<template>
    <div>
        <div class="w-full flex flex-col md:flex-row items-start mb-4 px-4 md:px-8">
            <!-- <div class="w-full md:w-auto text-center"> -->
            <div class="flex-grow md:w-auto min-w-0 w-full max-w-full">
                <!-- How to Take Temperature Measurement -->

                <TextTabs :items="tutorials" v-model="page" class="w-full text-left overflow-y-hidden">
                    <template #Measurements>
                        <TextSection :title="t('measurement.introduction.title')">
                            <p>{{ t("measurement.introduction.text") }}</p>
                        </TextSection>

                        <TextSection :title="t('measurement.step1.title')">
                            <div class="w-full max-w-full min-w-0">
                                <TextTabs
                                    :items="takeMeasurementTabs"
                                    v-model="measurement"
                                    class="w-full text-left min-w-0 overflow-y-hidden"
                                >
                                    <template #separate>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/separate-tap.png"
                                                        alt="Sink with separate taps"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step1.taps.separate.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="takeSeparate"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                    <template #faucet1>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/faucet1-tap.png"
                                                        alt="Sink with a faucet with separate cold/hot valves"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step1.taps.faucet1.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="takeFaucet1"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                    <template #faucet2>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/faucet2-tap.png"
                                                        alt="Sink with faucet with single handle"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step1.taps.faucet2.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="takeFaucet2"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                    <template #thermostatic>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/thermostatic-tap.png"
                                                        alt="Sink with thermostatic faucet"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step1.taps.thermostatic.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="takeThermostatic"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                </TextTabs>
                            </div>
                        </TextSection>
                        <TextSection>
                            <TextSubSection :title="t('measurement.step2.title')">
                                <p>{{ t("measurement.step2.text") }}</p>
                            </TextSubSection>
                        </TextSection>
                        <TextSection :title="t('measurement.step3.title')">
                            <p>{{ t("measurement.step3.text") }}</p>
                            <div class="w-full max-w-full min-w-0">
                                <TextTabs
                                    :items="thermometerTabs"
                                    v-model="thermometer"
                                    class="w-full text-left min-w-0 overflow-y-hidden"
                                >
                                    <template #room>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/room-thermometer.png"
                                                        alt="Room thermometer"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step3.tabs.room.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="roomThermometer"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>

                                    <template #infrared>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/infrared-thermometer.png"
                                                        alt="Infrared thermometer"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step3.tabs.infrared.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="infraredThermometer"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                    <template #fever>
                                        <TextSectionFlex>
                                            <template #left>
                                                <figure class="w-full max-w-sm mx-auto">
                                                    <img
                                                        src="@/assets/fever-thermometer.png"
                                                        alt="Fever thermometer"
                                                        class="w-full h-auto rounded shadow"
                                                    />
                                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                                        {{ t("measurement.step3.tabs.fever.caption") }}
                                                    </figcaption>
                                                </figure>
                                            </template>
                                            <template #right>
                                                <TextSubSection>
                                                    <div
                                                        v-html="feverThermometer"
                                                        class="whitespace-pre-line break-words overflow-x-scroll"
                                                    />
                                                </TextSubSection>
                                            </template>
                                        </TextSectionFlex>
                                    </template>
                                </TextTabs>
                            </div>
                        </TextSection>

                        <TextSection :title="t('measurement.conclusion.title')">
                            <TextSubSection :title="t('measurement.conclusion.title')">
                                <p>{{ t("measurement.conclusion.text") }}</p>
                            </TextSubSection>
                            <TextSubSection :title="t('measurement.next-steps.title')">
                                <p>{{ t("measurement.next-steps.text") }}</p>
                            </TextSubSection>
                        </TextSection>
                    </template>

                    <!-- How to use WATERWATCH Website -->
                    <template #Website>
                        <TextSection :title="t('website.introduction.title')">
                            <p>{{ t("website.introduction.text") }}</p>
                        </TextSection>

                        <TextSectionFlex :title="t('website.measurement.title')">
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/add-measurement-tutorial.png"
                                        alt="Add measurement button"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.measurement.caption1") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.measurement.text1") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex>
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/add-measurement-page.png"
                                        alt="Add measurement page"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.measurement.caption2") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.measurement.text2") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex :title="t('website.map.title')">
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/data-analysis.png"
                                        alt="Data analysis button"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.map.caption1") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.map.text1") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex>
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/graph-legend.png"
                                        alt="Graph legendn"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.map.caption2") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.map.text2") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex :title="t('website.export.title')">
                            <template #default>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.export.text1") }}</p>
                                    <p class="whitespace-pre-line">
                                        <em>{{ t("website.export.disclaimer") }}</em>
                                    </p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex>
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/download-export.png"
                                        alt="Download Button"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.export.caption1") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.export.text2") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSectionFlex>
                            <template #left>
                                <figure class="w-full max-w-sm mx-auto">
                                    <img
                                        src="@/assets/filters.png"
                                        alt="Download Filter Screen"
                                        class="w-full h-auto rounded shadow"
                                    />
                                    <figcaption class="mt-2 text-sm text-center text-gray-500">
                                        {{ t("website.export.caption2") }}
                                    </figcaption>
                                </figure>
                            </template>
                            <template #right>
                                <TextSubSection>
                                    <p class="whitespace-pre-line">{{ t("website.export.text3") }}</p>
                                </TextSubSection>
                            </template>
                        </TextSectionFlex>
                        <TextSection :title="t('website.conclusion.title')">
                            <TextSubSection>
                                <p>{{ t("website.conclusion.text") }}</p>
                            </TextSubSection>
                        </TextSection>
                    </template>

                    <!-- How to use WATERWATCH app -->
                    <template #MobileApp>
                        <TextSection :title="t('app.introduction.title')">
                            <p>{{ t("app.introduction.text") }}</p>
                        </TextSection>
                        <TextSectionSplit>
                            <template #left>
                                <TextSubSection :title="t('app.step1.title')">
                                    <p>{{ t("app.step1.text") }}</p>
                                </TextSubSection>
                                <TextSubSection :title="t('app.step2.title')">
                                    <p>{{ t("app.step2.text") }}</p>
                                </TextSubSection>
                            </template>

                            <TextSubSection :title="t('app.step3.title')">
                                <p>{{ t("app.step3.text") }}</p>
                            </TextSubSection>
                            <template #right>
                                <USkeleton class="w-full aspect-video"></USkeleton>
                            </template>
                        </TextSectionSplit>
                        <TextSection :title="t('app.conclusion.title')">
                            <TextSubSection>
                                <p>{{ t("app.conclusion.text") }}</p>
                            </TextSubSection>
                            <TextSubSection :title="t('app.next-steps.title')">
                                <p>{{ t("app.next-steps.text") }}</p>
                            </TextSubSection>
                        </TextSection>
                    </template>

                    <!-- How to use WATERWATCH API -->
                    <template #API>
                        <TextSection :title="t('api.introduction.title')">
                            <p>{{ t("api.introduction.text") }}</p>
                        </TextSection>
                        <TextSection :title="t('api.add.title')">
                            <div v-html="addMeasurementAPI" class="whitespace-pre-line break-words" />
                            <div class="w-full max-w-full min-w-0">
                                <TextTabs
                                    :items="addMeasurementAPITabs"
                                    v-model="api"
                                    class="w-full text-left min-w-0 overflow-y-hidden"
                                >
                                    <template #requestAdd>
                                        <div
                                            v-html="addMeasurementReq"
                                            class="whitespace-pre-line break-words overflow-x-scroll"
                                        />
                                    </template>
                                    <template #exampleAdd>
                                        <div v-html="addMeasurementEx" class="whitespace-pre-line break-words" />
                                    </template>
                                    <template #successAdd>
                                        <div v-html="addMeasurementSuccess" class="whitespace-pre-line" />
                                    </template>
                                    <template #errorAdd>
                                        <div v-html="addMeasurementErr" class="whitespace-pre-line break-words" />
                                    </template>
                                </TextTabs>
                            </div>
                        </TextSection>
                        <TextSection :title="t('api.export.title')">
                            <div v-html="exportMeasurementAPI" class="whitespace-pre-line" />
                            <div class="w-full relative max-w-full min-w-0">
                                <TextTabs
                                    :items="exportMeasurementAPITabs"
                                    v-model="apiExport"
                                    class="min-w-0 overflow-y-hidden"
                                >
                                    <template #requestExport>
                                        <div
                                            v-html="exportMeasurementReq"
                                            class="whitespace-pre-line break-words overflow-x-scroll"
                                        />
                                    </template>
                                    <template #geojsonExport>
                                        <div
                                            v-html="exportMeasurementGeoJson"
                                            class="whitespace-pre-line break-words overflow-x-scroll"
                                        />
                                    </template>
                                    <template #csvExport>
                                        <div class="relative overflow-x-scroll">
                                            <div
                                                v-html="exportMeasurementCSV"
                                                class="whitespace-pre-line break-words overflow-x-scroll"
                                            />
                                        </div>
                                    </template>
                                    <template #defaultExport>
                                        <div
                                            v-html="exportMeasurementDefault"
                                            class="whitespace-pre-line break-words overflow-x-scroll"
                                        />
                                    </template>
                                    <template #errorExport>
                                        <div
                                            v-html="exportMeasurementErr"
                                            class="whitespace-pre-line break-words overflow-x-scroll"
                                        />
                                    </template>
                                </TextTabs>
                            </div>
                        </TextSection>
                        <TextSection :title="t('api.conclusion.title')">
                            <p>{{ t("api.conclusion.text") }}</p>
                        </TextSection>
                    </template>
                </TextTabs>
            </div>
            <LanguageSwitcher
                class="w-full mt-2 md:mt-0 md:w-auto md:ml-4 border border-main rounded p-2 text-center"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * TutorialsView
 *
 * Renders a set of tutorial pages (Measurements, Website, Mobile App, API)
 * using tab navigation and sectional content components.
 */
defineOptions({ name: "TutorialsView" });
import { computed, ref } from "vue";
import TextSection from "../components/Text/Section.vue";
import TextSectionSplit from "../components/Text/SectionSplit.vue";
import TextSubSection from "../components/Text/SubSection.vue";
import TextTabs from "../components/Text/Tabs.vue";
import TextSectionFlex from "../components/Text/SectionFlex.vue";
import { useI18n } from "vue-i18n";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import MarkdownIt from "markdown-it";

const { t } = useI18n();
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const addMeasurementAPI = computed(() => md.render(t("api.add.text")));
const addMeasurementReq = computed(() => md.render(t("api.add.request.text")));
const addMeasurementEx = computed(() => md.render(t("api.add.example.text")));
const addMeasurementSuccess = computed(() => md.render(t("api.add.success.text")));
const addMeasurementErr = computed(() => md.render(t("api.add.error.text")));

const exportMeasurementAPI = computed(() => md.render(t("api.export.text")));
const exportMeasurementReq = computed(() => md.render(t("api.export.request.text")));
const exportMeasurementGeoJson = computed(() => md.render(t("api.export.geojson.text")));
const exportMeasurementCSV = computed(() => md.render(t("api.export.csv.text")));
const exportMeasurementDefault = computed(() => md.render(t("api.export.default.text")));
const exportMeasurementErr = computed(() => md.render(t("api.export.error.text")));

const takeSeparate = computed(() => md.render(t("measurement.step1.taps.separate.text")));
const takeFaucet1 = computed(() => md.render(t("measurement.step1.taps.faucet1.text")));
const takeFaucet2 = computed(() => md.render(t("measurement.step1.taps.faucet2.text")));
const takeThermostatic = computed(() => md.render(t("measurement.step1.taps.thermostatic.text")));

const roomThermometer = computed(() => md.render(t("measurement.step3.tabs.room.text")));
const infraredThermometer = computed(() => md.render(t("measurement.step3.tabs.infrared.text")));
const feverThermometer = computed(() => md.render(t("measurement.step3.tabs.fever.text")));

const page = ref<string>("Measurements");
const api = ref<string>("requestAdd");
const apiExport = ref<string>("requestExport");
const measurement = ref<string>("");
const thermometer = ref<string>("");

const tutorials = computed(() => [
    {
        label: t("labels.measurement"),
        slot: "Measurements",
    },
    {
        label: t("labels.website"),
        slot: "Website",
    },
    {
        label: t("labels.app"),
        slot: "MobileApp",
    },
    {
        label: t("labels.api"),
        slot: "API",
    },
]);

const takeMeasurementTabs = computed(() => [
    {
        label: t("measurement.step1.taps.separate.title"),
        slot: "separate",
    },
    {
        label: t("measurement.step1.taps.faucet1.title"),
        slot: "faucet1",
    },
    {
        label: t("measurement.step1.taps.faucet2.title"),
        slot: "faucet2",
    },
    {
        label: t("measurement.step1.taps.thermostatic.title"),
        slot: "thermostatic",
    },
]);

const thermometerTabs = computed(() => [
    {
        label: t("measurement.step3.tabs.room.title"),
        slot: "room",
    },
    {
        label: t("measurement.step3.tabs.infrared.title"),
        slot: "infrared",
    },
    {
        label: t("measurement.step3.tabs.fever.title"),
        slot: "fever",
    },
]);

const addMeasurementAPITabs = computed(() => [
    {
        label: t("api.add.request.title"),
        slot: "requestAdd",
    },
    {
        label: t("api.add.example.title"),
        slot: "exampleAdd",
    },
    {
        label: t("api.add.success.title"),
        slot: "successAdd",
    },
    {
        label: t("api.add.error.title"),
        slot: "errorAdd",
    },
]);

const exportMeasurementAPITabs = computed(() => [
    {
        label: t("api.export.request.title"),
        slot: "requestExport",
    },
    {
        label: t("api.export.geojson.title"),
        slot: "geojsonExport",
    },
    {
        label: t("api.export.csv.title"),
        slot: "csvExport",
    },
    {
        label: t("api.export.default.title"),
        slot: "defaultExport",
    },
    {
        label: t("api.export.error.title"),
        slot: "errorExport",
    },
]);
</script>
