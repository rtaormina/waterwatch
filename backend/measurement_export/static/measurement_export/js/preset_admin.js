/* global django */
(function () {
  /**
   * Initialize the preset form JavaScript.
   *
   * @returns {void}
   */
  function initializeForm() {
    const $ = django.jQuery;

    if (!$ || !$("#id_temperature_enabled").length) {
      // If jQuery or form elements aren't ready, try again in 100ms
      setTimeout(initializeForm, 100);
      return;
    }

    // console.log("Initializing preset form JavaScript"); // Debug log

    /**
     * Toggle visibility of temperature fields based on the "Enable temperature filter" checkbox.
     *
     * @returns {void}
     */
    function toggleTemps() {
      const on = $("#id_temperature_enabled").is(":checked");
      // console.log("Temperature enabled:", on); // Debug log

      ["temp_from", "temp_to", "temp_unit"].forEach((f) => {
        const field = $(".field-" + f);
        // console.log("Toggling field:", f, "Found elements:", field.length); // Debug log
        field.toggle(on);
      });
    }

    $("#id_temperature_enabled").change(toggleTemps);
    toggleTemps(); // Initial call

    /**
     * Load countries based on selected continents.
     *
     * @returns {void}
     */
    function loadCountries() {
      // console.log("Loading countries..."); // Debug log

      // Gather checked continent values
      const selected = $("#id_location_continents input[type=checkbox]:checked")
        .map(function () {
          return this.value;
        })
        .get();

      // console.log("Selected continents:", selected); // Debug log

      const container = $("#id_location_countries");
      const fieldContainer = $(".field-location_countries");

      // Store currently selected countries before clearing
      const currentlySelected = container
        .find("input[type=checkbox]:checked")
        .map(function () {
          return this.value;
        })
        .get();

      if (!selected.length) {
        // console.log("No continents selected, hiding countries field");
        // Hide smoothly without clearing first
        fieldContainer.fadeOut(150);
        return;
      }

      // Show the field section if hidden
      if (!fieldContainer.is(":visible")) {
        fieldContainer.fadeIn(150);
      }

      // Store current content to prevent flash
      const currentContent = container.html();
      console.debug("Current content before reload:", currentContent);
      // console.log("Current content:", currentContent); // Debug log

      // Only show loading if container is empty or has error message
      if (!container.find('input[type="checkbox"]').length) {
        container.html(
          '<div style="padding: 8px; color: #666;">Loading countries...</div>',
        );
      }

      // Fetch view at /api/locations/
      $.getJSON("/api/locations/")
        .done(function (data) {
          container.empty(); // Clear previous content

          // console.log("Received location data:", data); // Debug log

          // Flatten and dedupe
          const countries = Array.from(
            new Set(
              selected.flatMap(function (cont) {
                return data[cont] || [];
              }),
            ),
          ).sort();

          // console.log("Available countries:", countries); // Debug log

          // Clear and rebuild content
          container.empty();

          if (countries.length === 0) {
            container.html(
              '<div style="padding: 8px; color: #999;">No countries available for selected continents</div>',
            );
            return;
          }

          // PERFORMANCE OPTIMIZATION: Build HTML string instead of DOM manipulation
          let htmlParts = [];
          countries.forEach(function (country) {
            // Check if this country was previously selected
            const isChecked = currentlySelected.includes(country);
            const checkedAttr = isChecked ? 'checked="checked"' : "";

            htmlParts.push(`<label class="vCheckboxLabel">
               <input type="checkbox" name="location_countries" value="${country}"
                      class="vCheckboxField" ${checkedAttr}>
               ${country}
             </label>`);
          });

          // Insert all HTML at once
          container.html(htmlParts.join(""));

          addSelectAllToggle("location_countries");
        })
        .fail(function (xhr, status, error) {
          console.error("Failed to load countries:", status, error);
          container.html(
            '<div style="padding: 8px; color: #cc3333;">Error loading countries. Please try again.</div>',
          );
        });
    }

    /**
     * Add a "Select all" toggle button for multi-select fields.
     *
     * @param {string} fieldName - The name of the field to add the toggle for.
     * @returns {void}
     */
    function addSelectAllToggle(fieldName) {
      const fieldWrap = $(".field-" + fieldName);
      if (!fieldWrap.length) return;

      // remove any old button
      fieldWrap.find(".select-all-toggle").remove();

      // build the button
      const btn = $(`
    <a href="#" data-testid="select-all-toggle" class="select-all-toggle"
       style="display:block; clear:both; margin:8px 0;">
      Select all
    </a>
  `);

      if (fieldName === "location_countries") {
        const container = fieldWrap.find("#id_" + fieldName);
        if (container.length) {
          // place the button immediately after the scrollable container
          container.after(btn);
        } else {
          // fallback if container not yet in DOM
          fieldWrap.append(btn);
        }
      } else {
        // all other fields: before the help text, outside scrollable internals
        const helpEl = fieldWrap.find("p.help").first();
        if (helpEl.length) {
          helpEl.before(btn);
        } else {
          fieldWrap.append(btn);
        }
      }

      const inner = fieldWrap.find("#id_" + fieldName);
      if (!inner.length) {
        // fallback: if there is no inner widget yet, append at the end of fieldWrap
        fieldWrap.append(btn);
      } else {
        const helpEl = fieldWrap.find("p.help").first();

        if (helpEl.length) {
          helpEl.before(btn); // insert directly above help text (outside scroll container)
        } else {
          // fallback: append below fieldWrap (still outside scrollable container)
          fieldWrap.append(btn);
        }
      }

      /**
       * Update the "Select all" toggle button text based on checked state.
       *
       * @returns {void}
       */
      function updateToggle() {
        const inputs = fieldWrap.find("input[type=checkbox]");
        btn.text(
          inputs.filter(":checked").length ? "Deselect all" : "Select all",
        );
      }

      // PERFORMANCE OPTIMIZATION: Batch DOM updates and avoid triggering change events
      btn.on("click", function (e) {
        e.preventDefault();
        const inputs = fieldWrap.find("input[type=checkbox]");
        const none = inputs.filter(":checked").length === 0;

        // Batch the property changes without triggering events
        inputs.each(function () {
          this.checked = none;
        });

        // Update toggle text directly instead of calling the function
        btn.text(none ? "Deselect all" : "Select all");

        // SPECIAL CASE: If this is continents, trigger country reload
        if (fieldName === "location_continents") {
          debouncedReloadCountries();
        }
      });

      // PERFORMANCE OPTIMIZATION: Debounce the update function for manual checks
      let updateTimer;
      /**
       * Debounced function to update the toggle button text.
       *
       * @returns {void}
       */
      function debouncedUpdate() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateToggle, 100);
      }

      // Use event delegation and debouncing for better performance
      fieldWrap
        .off("change.toggle", "input[type=checkbox]")
        .on("change.toggle", "input[type=checkbox]", debouncedUpdate);

      // initial state
      updateToggle();
    }

    ["location_continents", "water_sources"].forEach(addSelectAllToggle);

    // PERFORMANCE OPTIMIZATION: Debounce country reloading
    let reloadTimer;
    /**
     * Debounced function to reload countries based on selected continents.
     *
     * @returns {void}
     */
    function debouncedReloadCountries() {
      clearTimeout(reloadTimer);
      reloadTimer = setTimeout(function () {
        loadCountries();
        // Add a small delay before adding the toggle to ensure DOM is ready
        setTimeout(function () {
          addSelectAllToggle("location_countries");
        }, 50);
      }, 150);
    }

    $(document).on(
      "change",
      "#id_location_continents input[type=checkbox]",
      debouncedReloadCountries,
    );

    // Initial load + toggle
    loadCountries();
    // Add a small delay before adding the toggle to ensure DOM is ready
    setTimeout(function () {
      addSelectAllToggle("location_countries");
    }, 100);
  }

  // Start initialization when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeForm);
  } else {
    initializeForm();
  }
})();
