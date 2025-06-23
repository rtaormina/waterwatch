# WATERWATCH Documentation

Welcome to the documentation page for WATERWATCH, an open-science open-source website to track worldwide drinking water temperatures.

```{eval-rst}
.. tip::
  This documentation is split into Backend, Website, and Mobile App sections. The Backend section encompasses the shared backend and API used by both the website and mobile app. If you are interested in the documentation for the website version of WATERWATCH, see :ref:`Website Documentation <website-section>`. If you are interested in the documentation for the mobile app version of WATERWATCH, see :ref:`Mobile App Documentation <mobile-app-section>`.
```

## Getting Started

New to WATERWATCH? Check out the following links:
- [Installation Guide](development/installation.md) (Website)
- [Contribution Guide](development/contribution_guide.md) (Website)
- [Troubleshooting Common Issues](development/troubleshooting.md) (Website)
- [API Specification](api_specs/api_specs.md)


```{eval-rst}
.. toctree::
   :maxdepth: 2
   :caption: Backend Documentation:

   reference/index
   api_specs/api_specs
```

```{eval-rst}
.. _website-section:
.. toctree::
   :maxdepth: 2
   :caption: Website Documentation:

   development/frontend_docs
   diagrams/diagrams
   development/installation
   development/development
   development/contribution_guide
   development/troubleshooting
   development/deployment
   e2e_testing/e2e_test
   manual_testing/manual_test
   load_testing/load_test
```


```{eval-rst}
.. _mobile-app-section:
```
```{eval-rst}
.. toctree::
   :maxdepth: 2
   :caption: Mobile App Documentation:

   mobile_app/installation
   mobile_app/development
   mobile_app/contribution_guide

```

## Contributing / Reporting Issues

WATERWATCH welcomes feedback and contributions! Feel free to [open an issue](https://gitlab.ewi.tudelft.nl/groups/cse2000-software-project/2024-2025/cluster-e/06c/-/issues) to report a bug or suggest a feature, check out our contribution guides for more details on helping develop WATERWATCH further:
- [Website](development/contribution_guide.md)
- [Mobile App](mobile_app/contribution_guide.md)
