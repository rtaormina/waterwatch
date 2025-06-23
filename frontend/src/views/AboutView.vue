<template>
    <div>
        <TextTabs :items="aboutPages" v-model="page" class="w-full text-left overflow-y-hidden" :switch-point="0">
            <template #about>
                <div class="mx-4 md:mx-8">
                    <TextSection title="What is WATERWATCH">
                        <p>
                            WATERWATCH is revolutionizing our understanding of global water temperatures through citizen
                            science. Our platform empowers anyone worldwide to contribute to climate change research by
                            collecting and sharing water temperature measurements. Researchers can access and export our
                            growing database to advance scientific knowledge and better understand climate change
                            impacts on our planet's waters.
                        </p>
                    </TextSection>
                    <TextSection title="Why WATERWATCH?">
                        <p>
                            Climate change is one of the most pressing challenges of our time, and understanding its
                            impact on our environment is crucial for effective mitigation and adaptation strategies.
                            Water temperature is a key indicator of climate change, affecting ecosystems, weather
                            patterns, and water quality. However, there is a significant lack of standardized water
                            temperature data available for researchers and policymakers.
                        </p>
                        <p>
                            Traditional methods of data collection are often limited by geographical constraints,
                            funding, and the availability of specialized equipment. This is where WATERWATCH comes in.
                            By democratizing data collection and making it accessible to researchers, we're helping
                            build a more complete picture of global water temperature trends and their connection to
                            climate change. Our platform serves as a bridge between citizen scientists and researchers,
                            fostering collaboration in environmental research.
                        </p>
                    </TextSection>
                </div>
            </template>

            <template #why>
                <div class="mx-4 md:mx-8">
                    <TextSection title="The Developers">
                        <TextSectionSplit>
                            <template #left>
                                <p>
                                    As a team of socially conscious students, we're driven by a shared vision of
                                    creating technology that benefits humanity. Our project began as part of the CSE2000
                                    course at TU Delft, where we collaborated with researchers who envisioned a global
                                    water temperature tracking system.
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
                                    The domain experts are the people who helped us with the domain knowledge and in
                                    guiding the vision of WATERWATCH.
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
                </div>
            </template>

            <template #privacy>
                <TextSection id="privacy-policy" class="mx-4 md:mx-8" title="Privacy Policy">
                    <p>
                        <strong>Data Controller:</strong>
                        Delft University of Technology
                        <br />
                        <strong>Address:</strong>
                        Mekelweg 5, 2628 CD Delft, The Netherlands
                        <br />
                        <strong>Contact:</strong>
                        <a href="mailto:r.taormina@tudelft.nl" class="text-blue-600 underline">r.taormina@tudelft.nl</a>
                    </p>
                    <br />

                    <ol class="list-decimal list-inside ml-6 space-y-8">
                        <li>
                            <strong>What We Collect</strong>
                            <p>
                                We collect the geolocation of your device (“location data”) when you visit
                                <em>waterwatch.tudelft.nl</em>
                                . No user accounts or personal identifiers (names, emails) are linked to this data.
                            </p>
                        </li>

                        <li>
                            <strong>Purpose of Processing</strong>
                            <p>
                                Your location data is used solely for scientific research on water temperature patterns.
                                Aggregated results may be published in academic reports or shared with research
                                partners, but no individual location traces will be identifiable.
                            </p>
                        </li>

                        <li>
                            <strong>Legal Basis</strong>
                            <p>
                                We process location data on the legal basis of public interest in scientific research
                                (GDPR Art. 6(1)(e) and 89). You may withdraw your consent at any time by disabling
                                location sharing in your browser; this stops new data collection but does not remove
                                data already gathered.
                            </p>
                        </li>

                        <li>
                            <strong>Data Retention</strong>
                            <p>
                                We retain location data indefinitely, unless you request deletion. All requests should
                                be sent to
                                <a href="mailto:r.taormina@tudelft.nl">r.taormina@tudelft.nl</a>
                                .
                            </p>
                        </li>

                        <li>
                            <strong>Data Sharing &amp; Third Parties</strong>
                            <p>We do not sell, rent or otherwise share your location data with any third parties.</p>
                        </li>

                        <li>
                            <strong>Cookies &amp; Tracking</strong>
                            <p>
                                We do not use any analytics scripts, cookies, or other tracking technologies beyond the
                                geolocation request itself.
                            </p>
                        </li>

                        <li>
                            <strong>Your Rights</strong>
                            <p>Under the GDPR you have the right to:</p>
                            <ul class="list-disc list-inside ml-6 space-y-1">
                                <li>Access the location data we hold about you</li>
                                <li>Rectify inaccurate data</li>
                                <li>Erase data (“right to be forgotten”)</li>
                                <li>Restrict or object to processing</li>
                                <li>Data portability</li>
                            </ul>
                            <p>
                                To exercise these rights, contact us at
                                <a href="mailto:r.taormina@tudelft.nl">r.taormina@tudelft.nl</a>
                                .
                            </p>
                        </li>

                        <li>
                            <strong>Security</strong>
                            <p>
                                We implement the following technical and organizational measures to safeguard your
                                location data:
                            </p>
                            <ul class="list-disc list-inside ml-6 space-y-1">
                                <li>
                                    Location data is pseudonymized by rounding to three decimal places before storage.
                                </li>
                                <li>All data transmissions occur over HTTPS (TLS-encrypted in transit).</li>
                                <li>
                                    Data is stored on secure servers managed by Delft University of Technology, using
                                    Django’s built‑in authentication and permission system to restrict access.
                                </li>
                                <li>
                                    Regular backups and security audits are performed to ensure data integrity and
                                    availability.
                                </li>
                            </ul>
                        </li>

                        <li>
                            <strong>Changes to This Policy</strong>
                            <p>
                                We may update this policy from time to time. The latest version will always be available
                                at
                                <a href="https://waterwatch.tudelft.nl/about" class="text-blue-600 underline">
                                    waterwatch.tudelft.nl/about
                                </a>
                                .
                            </p>
                        </li>
                    </ol>
                    <br />
                    <p class="mt-2"><em>Effective date: June 20, 2025</em></p>
                </TextSection>
            </template>
        </TextTabs>
    </div>
</template>

<script setup lang="ts">
/**
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
        slot: "about",
        value: "about",
    },
    {
        label: "The WATERWATCH Team",
        slot: "why",
        value: "why",
    },
    {
        label: "Privacy Policy",
        slot: "privacy",
        value: "privacy",
    },
];

const page = ref<string>(aboutPages[0].slot);
</script>
