import { mount } from "@vue/test-utils";
import TextSectionSplitComponent from "../../../../src/components/Text/SectionSplit.vue";
import { describe, expect, it } from "vitest";

describe("TextSectionSplitComponent", () => {
  it("Sets the title", () => {
    const wrapper = mount(TextSectionSplitComponent, {
      props: {
        title: "Hello world",
      },
    });

    // Assert the rendered text of the component
    expect(wrapper.find("h2").text()).toContain("Hello world");
  });

  it("Does not display any title without prop set", () => {
    const wrapper = mount(TextSectionSplitComponent);

    // Assert the rendered text of the component
    expect(wrapper.find("h2").exists()).toBeFalsy();
  });

  it("Sets the slot value", () => {
    const wrapper = mount(TextSectionSplitComponent, {
      slots: {
      left: '<p id="Left_content">Left Content</p>',
      right: '<p id="Right_content">Right Content</p>'
    }
    });

    // Assert the rendered text of the component
    expect(wrapper.find('#Left_content').text()).toContain("Left Content");
    expect(wrapper.find('#Right_content').text()).toContain("Right Content");
  });
});
