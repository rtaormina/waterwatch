import { mount } from "@vue/test-utils";
import TextSubSectionComponent from "../../../../src/components/Text/SubSection.vue";
import { describe, expect, it } from "vitest";

describe("TextSubSectionComponent", () => {
  it("Sets the title", () => {
    const wrapper = mount(TextSubSectionComponent, {
      props: {
        title: "Hello world",
      },
    });

    // Assert the rendered text of the component
    expect(wrapper.find("h3").text()).toContain("Hello world");
  });

  it("Does not display any title without prop set", () => {
    const wrapper = mount(TextSubSectionComponent);

    // Assert the rendered text of the component
    expect(wrapper.find("h3").exists()).toBeFalsy();
  });

  it("Sets the slot value", () => {
    const wrapper = mount(TextSubSectionComponent, {
      slots: {
      default: '<p id="content">Main Content</p>'
    }
    });

    // Assert the rendered text of the component
    expect(wrapper.find('#content').text()).toContain("Main Content");
  });
});
