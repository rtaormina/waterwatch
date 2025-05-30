<template>
    <div>
        <div class="flex items-center justify-between mb-4 px-4 md:px-8">
            <div class="flex-1 text-center">
                <TextTabs :items="tutorials" v-model="page" class="w-full text-center" />
            </div>
            <LanguageSwitcher class="ml-4 border border-main rounded p-2" />
        </div>
        <div class="mx-4 md:mx-8">
            <!-- How to Take Temperature Measurement -->
            <template v-if="page == 'Measurements'">
                <TextSection :title="t('measurement.introduction.title')">
                    <p>{{ t("measurement.introduction.text") }}</p>
                </TextSection>
                <TextSectionSplit>
                    <template #left>
                        <USkeleton class="w-full aspect-video"></USkeleton>
                    </template>
                    <template #right>
                        <TextSubSection :title="t('measurement.step1.title')">
                            <p>{{ t("measurement.step1.text") }}</p>
                        </TextSubSection>
                        <TextSubSection :title="t('measurement.step2.title')">
                            <p>{{ t("measurement.step2.text") }}</p>
                        </TextSubSection>
                        <TextSubSection :title="t('measurement.step2.title')">
                            <p>{{ t("measurement.step2.text") }}</p>
                        </TextSubSection>
                    </template>
                </TextSectionSplit>
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
            <template v-else-if="page == 'Website'">
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
            <template v-else-if="page == 'MobileApp'">
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
            <template v-else-if="page == 'API'">
                <TextSection :title="t('api.introduction.title')">
                    <p>{{ t("api.introduction.text") }}</p>
                </TextSection>
                <TextSection :title="t('api.add.title')">
                    <div v-html="addMeasurementAPI" class="whitespace-pre-line" />
                    <div><TextTabs :items="addMeasurementAPITabs" v-model="api" class="w-full text-center" /></div>
                    <div
                        v-if="api == 'request'"
                        v-html="addMeasurementReq"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="api == 'example'"
                        v-html="addMeasurementEx"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="api == 'success'"
                        v-html="addMeasurementSuccess"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="api == 'error'"
                        v-html="addMeasurementErr"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                </TextSection>
                <TextSection :title="t('api.export.title')">
                    <div v-html="exportMeasurementAPI" class="whitespace-pre-line" />
                    <div>
                        <TextTabs :items="exportMeasurementAPITabs" v-model="apiExport" class="w-full text-center" />
                    </div>
                    <div
                        v-if="apiExport == 'request'"
                        v-html="exportMeasurementReq"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="apiExport == 'geojson'"
                        v-html="exportMeasurementGeoJson"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="apiExport == 'csv'"
                        v-html="exportMeasurementCSV"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="apiExport == 'default'"
                        v-html="exportMeasurementDefault"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                    <div
                        v-if="apiExport == 'error'"
                        v-html="exportMeasurementErr"
                        class="whitespace-pre-line overflow-x-scroll"
                    />
                </TextSection>
                <TextSection :title="t('api.conclusion.title')">
                    <p>{{ t("api.conclusion.text") }}</p>
                </TextSection>
            </template>
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

const page = ref<string>("Measurements");
const api = ref<string>("request");
const apiExport = ref<string>("request");

const tutorials = computed(() => [
    {
        label: t("labels.measurement"),
        value: "Measurements",
    },
    {
        label: t("labels.website"),
        value: "Website",
    },
    {
        label: t("labels.app"),
        value: "MobileApp",
    },
    {
        label: t("labels.api"),
        value: "API",
    },
]);

const addMeasurementAPITabs = computed(() => [
    {
        label: t("api.add.request.title"),
        value: "request",
    },
    {
        label: t("api.add.example.title"),
        value: "example",
    },
    {
        label: t("api.add.success.title"),
        value: "success",
    },
    {
        label: t("api.add.error.title"),
        value: "error",
    },
]);

const exportMeasurementAPITabs = computed(() => [
    {
        label: t("api.export.request.title"),
        value: "request",
    },
    {
        label: t("api.export.geojson.title"),
        value: "geojson",
    },
    {
        label: t("api.export.csv.title"),
        value: "csv",
    },
    {
        label: t("api.export.default.title"),
        value: "default",
    },
    {
        label: t("api.export.error.title"),
        value: "error",
    },
]);
</script>
