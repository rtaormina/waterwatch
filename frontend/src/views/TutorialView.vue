<template>
    <div>
        <TextTabs :items="tutorials" v-model="page" class="mb-4 w-full text-center" />
        <div class="mx-4 md:mx-8">
            <template v-if="page == 'Measurements'">
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
                        <USkeleton class="w-full aspect-video"></USkeleton>
                    </template>
                    <template #right>
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
                        <TextSubSection title="Step 3">
                            <p>
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                                voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore
                                quibusdam tempore dolorem. Enim, et qui.
                            </p>
                        </TextSubSection>
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
            <template v-else-if="page == 'Website'">
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
                    <template #right>
                        <TextSubSection title="Step 3">
                            <p>
                                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni vero at ipsam,
                                voluptatibus nemo eum adipisci sunt, deserunt aliquam nihil ipsum quam inventore
                                quibusdam tempore dolorem. Enim, et qui. Lorem ipsum dolor sit amet consectetur
                                adipisicing elit. Alias facilis beatae quae necessitatibus harum ad, autem rem minus,
                                mollitia perspiciatis magnam. Aspernatur exercitationem vero ad, enim quae dolorum
                                doloremque soluta.
                            </p>
                        </TextSubSection>
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

const page = ref<string>("Measurements");

const tutorials = [
    {
        label: "How to Take Water Temperature Measurements",
        value: "Measurements",
    },
    {
        label: "How to Use the WATERWATCH Website",
        value: "Website",
    },
    {
        label: "How to Use the WATERWATCH Mobile App",
        value: "MobileApp",
    },
    {
        label: "How to Use the WATERWATCH API",
        value: "API",
    },
];
</script>
