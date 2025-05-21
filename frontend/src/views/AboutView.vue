<template>
  <div>
    <Navbar />
    <TextTabs
      :items="aboutPages"
      v-model="page"
      class="mb-4 w-full text-center"
      :switch-point="0"
    />
    <div class="mx-4 md:mx-8">
      <template v-if="page == 'About WATERWATCH'">
        <TextSection title="Introduction">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
          </p>
        </TextSection>
        <TextSectionSplit>
          <template #left>
            <USkeleton class="w-full aspect-video"></USkeleton>
          </template>
          <template #right>
            <TextSubSection title="Step 1">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui.
              </p>
            </TextSubSection>
            <TextSubSection title="Step 2">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui.
              </p>
            </TextSubSection>
            <TextSubSection title="Step 3">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui.
              </p>
            </TextSubSection>
          </template>
        </TextSectionSplit>
        <TextSection title="Conclusion">
          <TextSubSection title="Conclusion">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
              vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt
              aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
              Enim, et qui.
            </p>
          </TextSubSection>
          <TextSubSection title="Next Steps">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
              vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt
              aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
              Enim, et qui.
            </p>
          </TextSubSection>
        </TextSection>
      </template>
      <template v-else-if="page == 'The Developers'">
        <TextSection title="Introduction">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
          </p>
        </TextSection>
        <TextSectionSplit>
          <template #left>
            <TextSubSection title="Step 1">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui.
              </p>
            </TextSubSection>
            <TextSubSection title="Step 2">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui.
              </p>
            </TextSubSection>
          </template>
          <template #right>
            <TextSubSection title="Step 3">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex
                magni vero at ipsam, voluptatibus nemo eum adipisci sunt,
                deserunt aliquam nihil ipsum quam inventore quibusdam tempore
                dolorem. Enim, et qui. Lorem ipsum dolor sit amet consectetur
                adipisicing elit. Alias facilis beatae quae necessitatibus harum
                ad, autem rem minus, mollitia perspiciatis magnam. Aspernatur
                exercitationem vero ad, enim quae dolorum doloremque soluta.
              </p>
            </TextSubSection>
          </template>
        </TextSectionSplit>
        <TextSection title="Conclusion">
          <TextSubSection title="Conclusion">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
              vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt
              aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
              Enim, et qui.
            </p>
          </TextSubSection>
          <TextSubSection title="Next Steps">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
              vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt
              aliquam nihil ipsum quam inventore quibusdam tempore dolorem.
              Enim, et qui.
            </p>
          </TextSubSection>
        </TextSection>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Navbar from "../components/NavBar.vue";
import TextSection from "../components/Text/Section.vue";
import TextSectionSplit from "../components/Text/SectionSplit.vue";
import TextSubSection from "../components/Text/SubSection.vue";
import TextTabs from "../components/Text/Tabs.vue";

const page = ref<string>("Measurements");

const aboutPages = [
  {
    label: "About WATERWATCH",
    value: "About WATERWATCH",
  },
  {
    label: "The Developers",
    value: "The Developers",
  },
];
</script>
