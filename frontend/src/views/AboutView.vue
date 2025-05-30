<template>
    <div>
        <TextTabs :items="aboutPages" v-model="page" class="mb-4 w-full text-center" :switch-point="0" />
        <div class="mx-4 md:mx-8">
            <template v-if="page == 'About WATERWATCH'">
                <TextSection title="What is WATERWATCH">
                    <p>
                        WATERWATCH is revolutionizing our understanding of global water temperatures through citizen
                        science. Our platform empowers anyone worldwide to contribute to climate change research by
                        collecting and sharing water temperature measurements. Researchers can access and export our
                        growing database to advance scientific knowledge and better understand climate change impacts on
                        our planet's waters.
                    </p>
                </TextSection>
                <TextSection title="Why WATERWATCH?">
                    <p>
                        Climate change is one of the most pressing challenges of our time, and understanding its impact
                        on our environment is crucial for effective mitigation and adaptation strategies. Water
                        temperature is a key indicator of climate change, affecting ecosystems, weather patterns, and
                        water quality. However, there is a significant lack of standardized water temperature data
                        available for researchers and policymakers.
                    </p>
                    <p>
                        Traditional methods of data collection are often limited by geographical constraints, funding,
                        and the availability of specialized equipment. This is where WATERWATCH comes in. By
                        democratizing data collection and making it accessible to researchers, we're helping build a
                        more complete picture of global water temperature trends and their connection to climate change.
                        Our platform serves as a bridge between citizen scientists and researchers, fostering
                        collaboration in environmental research.
                    </p>
                </TextSection>
            </template>
            <template v-else-if="page == 'The WATERWATCH Team'">
                <TextSection title="The Developers">
                    <TextSectionSplit>
                        <template #left>
                            <p>
                                As a team of socially conscious students, we're driven by a shared vision of creating
                                technology that benefits humanity. Our project began as part of the CSE2000 course at TU
                                Delft, where we collaborated with researchers who envisioned a global water temperature
                                tracking system.
                            </p>
                        </template>
                        <template #right>
                            <ul class="list-disc list-inside">
                                <li>Thomas Bood</li>
                                <li>Stella Schultz</li>
                                <li>Erik Koprivanacz</li>
                                <li>Nico Hammer</li>
                                <li>Pieter van den Haspel</li>
                            </ul>
                        </template>
                    </TextSectionSplit>
                </TextSection>
                <TextSectionSplit>
                    <template #left>
                        <TextSection title="The Domain Experts">
                            <p>
                                The domain experts are the people who helped us with the domain knowledge and in guiding
                                the vision of WATERWATCH.
                            </p>
                            <ul class="list-disc list-inside">
                                <li>dr.ir. Mirjam Blokker</li>
                                <li>Prof. Dr. Andrea Cominola</li>
                                <li>Demetrios Eliades, PhD</li>
                                <li>Dr. Riccardo Taormina</li>
                            </ul>
                        </TextSection>
                    </template>
                    <template #right>
                        <TextSection title="Additional Support">
                            <p>
                                Additional thanks to everyone who helped in any way, shape, or form to help make
                                WATERWATCH a reality. With an highlight of the following people:
                            </p>
                            <ul class="list-disc list-inside">
                                <li>Ivo van Kreveld</li>
                                <li>Alexandra Marcu</li>
                            </ul>
                        </TextSection>
                    </template>
                </TextSectionSplit>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * AboutView
 *
 * This component renders the “About WATERWATCH” and “The WATERWATCH Team” pages
 * as two tabs.  It uses `TextTabs`, `TextSection` and `TextSectionSplit` to
 * organize content about the project mission and the people behind it.
 */
defineOptions({
    name: "AboutView",
});
import { ref } from "vue";
import TextSection from "../components/Text/Section.vue";
import TextSectionSplit from "../components/Text/SectionSplit.vue";
import TextTabs from "../components/Text/Tabs.vue";

const aboutPages = [
    {
        label: "About WATERWATCH",
        value: "About WATERWATCH",
    },
    {
        label: "The WATERWATCH Team",
        value: "The WATERWATCH Team",
    },
];

const page = ref<string>(aboutPages[0].value);
</script>
