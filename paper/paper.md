---
title: "WaterWatch: An open-source platform for crowdsourced monitoring of drinking water temperature"
tags: 
    - water quality
    - water temperature
    - measurments
authors:
    - name: Nico Hammer
      equal-contrib: true
      affiliation: 1
    - name: Stella Schultz
      equal-contrib: true
      affiliation: 1
    - given-names: Pieter
      dropping-particle: van den
      surname: Haspel
      equal-contrib: true
      affiliation: 1
    - name: Erik Koprivanacz
      equal-contrib: true
      affiliation: 1
    - name: Thomas Bood
      equal-contrib: true
      affiliation: 1
    - name: Riccardo Taormina
      affiliation: 1
    - name: Mirjam Blokker
      affiliation: "1,2"
    - name: Andrea Cominola
      affiliation: "3,4"
    - name: Demetris Eliades
      affiliation: 5
affiliations:
    - index: 1
      name: Delft University of Technology, The Netherlands
    - index: 2
      name: KWR Water Research Institute, The Netherlands
    - index: 3
      name: Technische Universität Berlin, Germany
    - index: 4
      name: Einstein Center Digital Future, Germany
    - index: 5
      name: KIOS Research & Innovation Center of Excellence, University of Cyprus, Cyprus
date: 22 July 2025
bibliography: paper.bib
---

# Summary
Rising global temperatures are increasing drinking-water temperatures worldwide. Warmer water fosters microbial regrowth, weakens disinfection, and raises pathogen risks. Yet, despite these concerns, high-resolution spatial data on drinking-water temperature remain scarce. Citizen science offers a promising, low-cost way to close this gap. **WaterWatch** is an open-source, browser-based platform that empowers citizen scientists and researchers to record, visualise, and share household tap-water temperatures, while preserving privacy. Built with a Vue 3 single-page front-end and a Django/PostGIS back-end, the platform provides real-time recordings with range checks, an interactive hex-binned global map, basic analytics, and filtered data export. The underlying data model is deliberately generic to enable researchers to add further water-quality metrics — such as pH or turbidity - with minimal efforts. The full source code, container recipes, and developer documentation are released under permissive licences, ensuring that utilities, public-health agencies, and grassroots communities can replicate, audit, or extend the platform.

# Statement of need
Rising global temperatures are increasing drinking-water temperatures worldwide — a trend with serious public health implications. Even modest warming can accelerate disinfectant decay, promote microbial regrowth, and increase the risk of opportunistic pathogens such as Legionella pneumophila and Naegleria Fowleri `[@furst2024s]`. Recognizing this risk, research advises keeping drinking water below 25 °C to discourage the growth of pathogens `[@van2023influence]`. Studies also show that chlorine residuals may decay much faster with rising temperatures `[@furst2024s]`. Despite this clear public-health rationale, high-resolution drinking-water temperature data remain scarce `[@agudelo2020drinking]`. Professional loggers are expensive and typically installed at only a few trunk-main locations, offering limited spatial and temporal coverage. Crowdsourcing presents an affordable alternative, measuring water temperature requires only simple tools, can be carried out with minimal guidelines, and smartphones can provide approximate location metadata. However, existing citizen-science platforms lack workflows tailored to tap-water safety.

**WaterWatch** fills this critical gap with a privacy-conscious platform for collecting water temperature measurements from the public. It publishes data through a public API in research-ready CSV and GeoJSON formats. The platform supports both urban and rural contexts, allowing users to specify the type of their water source, such as municipal taps, private wells, consumer tanks, or other systems — capturing essential diversity in infrastructure. Its schema enables temperature tracking aligned with water-safety plans, which can be extended to accommodate additional sources (i.e., rivers), making it suitable for even broader monitoring efforts. By simplifying data collection and access, WaterWatch empowers citizens to advance water safety and equips researchers, health officials, and utilities with high-resolution monitoring data and actionable insights on drinking-water temperature.

# Software description
## Architecture
WaterWatch adopts a layered, loosely coupled Model-View-Controller (MVC) design that emphasises extensibility and clear separation of concerns, showcased in Figure \autoref{fig:Fig_1}. At the view layer, users interact through the website to add measurements or inspect analytics. A screenshot example is provided in Figure \autoref{fig:Fig_2}. Each submission is routed by the Data Collection Controller to a Validation Controller. Once checked, the Database Controller persists the record. Down-stream workflows are handled by dedicated controllers: the Data Analysis Controller fetches data and computes summary statistics for on-screen charts, while the Data Export Controller streams large, filtered datasets in the requested format for export. A hierarchical, role-based access model underpins security: anonymous users may upload data without authentication; signed-in researchers can export datasets; admins authenticate via the Authentication Controller and gain full privileges to edit measurements, manage campaigns, and assign tags. This modular arrangement — illustrated in the component and container diagrams of Figure \autoref{fig:Fig_2} — maps naturally onto MVC: database models form the Model, the web/mobile UIs the View, and the specialised controllers the Controller layer, enabling straightforward extension and maintainability.

![Architectural diagram of WaterWatch with its key components and their interactions.\label{fig:Fig_1}](Fig_1.png)

## Frameworks & Technologies
WaterWatch’s web stack pairs a responsive, lightweight front-end with a geospatially focused back-end. A Vue 3 single-page application delivers the user interface. The back-end API layer is built on Django 4.2, whose Object-Relational Mapping, security middleware, and admin interface ensure maintainable server logic. Interactive mapping relies on Leaflet for basemap rendering, while D3.js generates hex-bin overlays and analytic charts. Measurement records are stored in PostgreSQL with PostGIS, providing spatial indexes and SQL functions for hex-grid aggregation and privacy-preserving coordinate rounding (~100 meters).

## Key features
 
| Category            | Functionality |  
|---------------------|---------------|  
| **Data collection** | Anonymous or authenticated upload; client-side range check of drinking-water data (0–100 °C); optional GPS or map-click location; step-by-step thermometer tutorial. |  
| **Visualisation**   | Global hex-bin map with zoom-adaptive bin size; colour scales for mean temperature or sample count; side-by-side region comparison. |  
| **Analytics**       | Per-hex statistics (mean, median, min–max); kernel-density plot; interactive slider for last 30 days or arbitrary calendar window. |  
| **Export**          | Filter by continent, country, water source, temperature range, date, and time; download CSV or GeoJSON. |  
| **Administration**  | Role-based dashboard to moderate outliers and publish campaign banners (e.g. World Water Day). |  
| **Extensibility**   | Generic `measurement` table plus metric-specific extension tables enable rapid addition of new variables (e.g., pH, turbidity, residual chlorine) with minimal code. | 

![WaterWatch web interface showcasing the interactive map for a test example and data analytics across two groups of hexagons.\label{fig:Fig_2}](Fig_2.png)

# AI usage disclosure
Generative AI tools from OpenAI were used for minor language editing of this manuscript.

# Acknowledgements  
We thank **Ivo van Kreveld** and **Alexandra Marcu** from Delft University of Technology for their support and continuous feedback during development.
