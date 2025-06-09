"""Factories for exporting measurement data in different formats."""

from .strategies import CsvExport, GeoJsonExport, JsonExport, MapFormatExport, XmlExport

STRATEGIES = {
    "csv": CsvExport(),
    "json": JsonExport(),
    "xml": XmlExport(),
    "geojson": GeoJsonExport(),
    "map-format": MapFormatExport(),
}


def get_strategy(format_key):
    """Get the export strategy based on the format key.

    Parameters
    ----------
    format_key : str
        The format key for the export strategy (e.g., "csv", "json", "xml", "geojson").

    Returns
    -------
    ExportStrategy
        An instance of the export strategy corresponding to the format key.
        If the format key is not recognized, defaults to JsonExport.
    """
    return STRATEGIES.get(format_key, JsonExport())
