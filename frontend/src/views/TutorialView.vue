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
                <TextSectionSplit>
                    <template #left>
                        <TextSubSection :title="t('website.map.title')">
                            <p class="whitespace-pre-line">{{ t("website.map.text") }}</p>
                        </TextSubSection>
                    </template>
                    <template #right>
                        <USkeleton class="w-full aspect-video"></USkeleton>
                    </template>
                </TextSectionSplit>
                <TextSectionSplit>
                    <template #left>
                        <USkeleton class="w-full aspect-video"></USkeleton>
                    </template>
                    <template #right>
                        <TextSubSection :title="t('website.export.title')">
                            <p class="whitespace-pre-line">{{ t("website.export.text1") }}</p>
                            <p class="whitespace-pre-line">
                                <em>{{ t("website.export.disclaimer") }}</em>
                            </p>
                            <p class="whitespace-pre-line">{{ t("website.export.text2") }}</p>
                        </TextSubSection>
                    </template>
                </TextSectionSplit>
                <TextSection :title="t('website.conclusion.title')">
                    <TextSubSection>
                        <p>{{ t("website.conclusion.text") }}</p>
                    </TextSubSection>
                </TextSection>
            </template>

            <!-- How to use WATERWATCH app -->
            <template v-else-if="page == 'MobileApp'">
                <TextSection title="Introduction">
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam, voluptatibus
                        nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
                        Enim, et qui. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                        voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                        tempore dolorem. Enim, et qui.
                    </p>
                </TextSection>
                <TextSectionSplit>
                    <template #left>
                        <TextSubSection title="Step 1">
                            <p>
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                                voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore
                                quibusdam tempore dolorem. Enim, et qui.
                            </p>
                        </TextSubSection>
                        <TextSubSection title="Step 2">
                            <p>
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                                voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore
                                quibusdam tempore dolorem. Enim, et qui.
                            </p>
                        </TextSubSection>
                    </template>

                    <TextSubSection title="Step 3">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                            voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                            tempore dolorem. Enim, et qui. Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Alias facilis beatae quae necessitatibus harum ad, autem rem minus, mollitia perspiciatis
                            magnam. Aspernatur exercitationem vero ad, enim quae dolorum doloremque soluta.
                        </p>
                    </TextSubSection>
                    <template #right>
                        <USkeleton class="w-full aspect-video"></USkeleton>
                    </template>
                </TextSectionSplit>
                <TextSection title="Conclusion">
                    <TextSubSection title="Conclusion">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                            voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                            tempore dolorem. Enim, et qui.
                        </p>
                    </TextSubSection>
                    <TextSubSection title="Next Steps">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                            voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                            tempore dolorem. Enim, et qui.
                        </p>
                    </TextSubSection>
                </TextSection>
            </template>

            <!-- How to use WATERWATCH API -->
            <template v-else-if="page == 'API'">
                <TextSection title="Introduction">
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam, voluptatibus
                        nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
                        Enim, et qui. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                        voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                        tempore dolorem. Enim, et qui.
                    </p>
                    <TextSubSection title="Conclusion">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                            voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                            tempore dolorem. Enim, et qui.
                        </p>
                    </TextSubSection>
                    <TextSubSection title="Next Steps">
                        <p>
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                            voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore quibusdam
                            tempore dolorem. Enim, et qui.
                        </p>
                    </TextSubSection>
                </TextSection>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TextSection from "../components/Text/Section.vue";
import TextSectionSplit from "../components/Text/SectionSplit.vue";
import TextSubSection from "../components/Text/SubSection.vue";
import TextTabs from "../components/Text/Tabs.vue";
import TextSectionFlex from "../components/Text/SectionFlex.vue";
import { useI18n } from "vue-i18n";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
const { t } = useI18n();

const page = ref<string>("Measurements");

const tutorials = [
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
];
</script>
