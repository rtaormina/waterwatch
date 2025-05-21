<template>
  <div>
    <Navbar />
    <UTabs :items="tutorials" class="w-full" variant="link" color="primary">
      <template #Measurements>
        <h1 class="text-2xl mb-4">
          Tutorial: How to Take Water Temperature Measurements
        </h1>
        <USeparator />
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
      <template #Website>
        <h1 class="text-2xl mb-4">
          Tutorial: How to Use the WATERWATCH Website
        </h1>
        <USeparator />

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
      <template #MobileApp>
        <h1 class="text-2xl mb-4">
          Tutorial: How to Use the WATERWATCH Mobile App
        </h1>
        <USeparator />
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
      <template #API>
        <h1 class="text-2xl mb-4">Tutorial: How to Use the WATERWATCH API</h1>
        <USeparator />
        <TextSection title="Introduction">
          <p>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex magni
            vero at ipsam, voluptatibus nemo eum adipisci sunt, deserunt aliquam
            nihil ipsum quam inventore quibusdam tempore dolorem. Enim, et qui.
          </p>
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
    </UTabs>
  </div>
</template>

<script setup lang="ts">
import Navbar from "../components/NavBar.vue";
import TextSection from "../components/Text/Section.vue";
import TextSectionSplit from "../components/Text/SectionSplit.vue";
import TextSubSection from "../components/Text/SubSection.vue";

const tutorials = [
  {
    label: "How to Take Water Temperature Measurements",
    slot: "Measurements",
  },
  {
    label: "How to Use the WATERWATCH Website",
    slot: "Website",
  },
  {
    label: "How to Use the WATERWATCH Mobile App",
    slot: "MobileApp",
  },
  {
    label: "How to Use the WATERWATCH API",
    slot: "API",
  },
];
</script>
