# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Autodoc configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/extensions/autodoc.html
import sys
from pathlib import Path

sys.path.insert(0, str(Path("..", "backend").resolve()))

autoapi_type = "python"
autoapi_dirs = [
    "../backend/api",
    "../backend/campaigns",
    "../backend/measurement_analysis",
    "../backend/measurements",
    "../backend/measurement_collection",
    "../backend/measurement_export",
    "../backend/backend",
]
autoapi_root = "reference"
autoapi_ignore = [
    "**/migrations/**",
    "**/api/admin**",
    "**/api/tests**",
    "**/api/models**",
    "**/backend/backend/tests**",
    "**/measurement_export/admin**",
    "**/measurement_analysis/admin**",
    "**/measurement_analysis/models**",
    "**/measurement_analysis/tests**",
    "**/measurement_analysis/views**",
    "**/measurement_collection/admin**",
    "**/measurement_collection/models**",
]

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "WATERWATCH"
copyright = "2025, WATERWATCH Team"
author = "WATERWATCH Team"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.napoleon",
    "sphinx.ext.autodoc",
    "sphinx.ext.mathjax",
    "sphinx.ext.viewcode",
    "sphinxcontrib.openapi",
    "myst_parser",
    "autoapi.extension",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]

# -- Options for MyST parser -------------------------------------------------
# https://myst-parser.readthedocs.io/en/latest/syntax/optional.html
source_suffix = {
    ".rst": "restructuredtext",
    ".txt": "markdown",
    ".md": "markdown",
}

myst_enable_extensions = [
    "dollarmath",
    "deflist",
]
