import { mount } from "@vue/test-utils";
import TextSectionComponent from "../../../../src/components/Text/Section.vue";
import { describe, expect, it } from "vitest";

describe("TextSectionComponent", () => {
  it("Sets the title", () => {
    const wrapper = mount(TextSectionComponent, {
      props: {
        title: "Hello world",
      },
    });

    // Assert the rendered text of the component
    expect(wrapper.find("h2").text()).toContain("Hello world");
  });

  it("Does not display any title without prop set", () => {
    const wrapper = mount(TextSectionComponent);

    // Assert the rendered text of the component
    expect(wrapper.find("h2").exists()).toBeFalsy();
  });

  it("Sets the slot value", () => {
    const wrapper = mount(TextSectionComponent, {
      slots: {
      default: '<p id="content">Main Content</p>'
    }
    });

    // Assert the rendered text of the component
    expect(wrapper.find('#content').text()).toContain("Main Content");
  });
});
