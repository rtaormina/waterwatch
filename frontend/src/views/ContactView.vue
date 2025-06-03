<template>
    <div class="mx-4 md:mx-8">
        <TextSection title="CONTACT WATERWATCH">
            <p>
                In case you have any questions, suggestions, or feedback regarding WATERWATCH, please feel free to reach
                out to us via email. We are always happy to hear from you and will do our best to respond as soon as
                possible.
            </p>
            <TextSubSection title="Issues, bugs, and feature requests">
                <p>
                    If you encounter any issues or bugs while using WATERWATCH, or if you have a feature request, please
                    report them via our
                    <a
                        href="https://gitlab.ewi.tudelft.nl/cse2000-software-project/2024-2025/cluster-e/06c/06c/-/issues/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span class="underline text-primary-500 hover:text-primary-700">GitLab issue tracker</span>
                    </a>
                    . This helps us keep track of all reported issues and prioritize them accordingly. For more
                    information on how to report issues, please refer to our
                    <a
                        href="https://waterwatch.tudelft.nl/docs/contribution_guide.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span class="underline text-primary-500 hover:text-primary-700">contributing guidelines</span>
                    </a>
                    .
                </p>
            </TextSubSection>
        </TextSection>
    </div>
</template>

<script setup lang="ts">
/**
 * ContactView
 *
 * This component renders the “Contact WATERWATCH” page.
 * It displays simple contact information and instructions.
 */
defineOptions({
    name: "ContactView",
});
import TextSection from "../components/Text/Section.vue";
import TextSubSection from "../components/Text/SubSection.vue";
</script>
