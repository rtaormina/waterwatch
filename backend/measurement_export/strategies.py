"""Strategies for exporting measurements in different formats."""

import csv
import json
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from xml.dom import minidom
from xml.etree.ElementTree import Element, SubElement

from django.http import HttpResponse, JsonResponse


class ExportStrategy(ABC):
    """Interface for exporting measurements.

    This class defines the interface for exporting measurements in different formats.
    Subclasses should implement the `export` method to handle specific export formats.

    Parameters
    ----------
    ABC : Abstract Base Class
        Abstract base class for defining abstract methods and properties.

    Methods
    -------
    export(data)
        Given serialized data, return an HttpResponse.
    """

    @abstractmethod
    def export(self, data):
        """Given serialized data, return an HttpResponse.

        Parameters
        ----------
        data : list
            List of serialized measurement data to be exported.

        Returns
        -------
        HttpResponse
            HTTP response containing the exported data in the specified format.
        """


class CsvExport(ExportStrategy):
    """Export measurements in CSV format.

    This class implements the `export` method to handle CSV export of measurement data.

    Parameters
    ----------
    ExportStrategy : Abstract Base Class
        Inherits from the abstract base class `ExportStrategy`.

    Methods
    -------
    export(data)
        Given serialized data, return an HttpResponse with CSV content.
    """

    def export(self, data):
        """Export the given data to CSV format.

        Parameters
        ----------
        data : list
            List of serialized measurement data to be exported.

        Returns
        -------
        HttpResponse
            HTTP response containing the exported data in CSV format.
        """
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="measurements.csv"'
        writer = csv.writer(resp)
        if data:
            headers = list(data[0].keys())
            writer.writerow(headers)
            for item in data:
                item["metrics"] = json.dumps(item["metrics"])
                item["location"] = json.dumps(item["location"])
                writer.writerow(item.values())
        return resp


class JsonExport(ExportStrategy):
    """Export measurements in JSON format.

    This class implements the `export` method to handle JSON export of measurement data.

    Parameters
    ----------
    ExportStrategy : Abstract Base Class
        Inherits from the abstract base class `ExportStrategy`.

    Methods
    -------
    export(data)
        Given serialized data, return an HttpResponse with JSON content.
    """

    def export(self, data):
        """Export the given data to JSON format.

        Parameters
        ----------
        data : list
            List of serialized measurement data to be exported.

        Returns
        -------
        HttpResponse
            HTTP response containing the exported data in JSON format.
        """
        return JsonResponse(data, safe=False, json_dumps_params={"indent": 2})


class GeoJsonExport(ExportStrategy):
    """Export measurements in GeoJSON format.

    This class implements the `export` method to handle GeoJSON export of measurement data.

    Parameters
    ----------
    ExportStrategy : Abstract Base Class
        Inherits from the abstract base class `ExportStrategy`.

    Methods
    -------
    export(data)
        Given serialized data, return an HttpResponse with GeoJSON content.
    """

    def export(self, data):
        """Export the given data to GeoJSON format.

        Parameters
        ----------
        data : list
            List of serialized measurement data to be exported.

        Returns
        -------
        HttpResponse
            HTTP response containing the exported data in GeoJSON format.
        """
        features = []
        for item in data:
            features.append(
                {
                    "type": "Feature",
                    "properties": {k: v for k, v in item.items() if k != "location"},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [item["location"]["longitude"], item["location"]["latitude"]],
                    },
                }
            )
        geojson = {"type": "FeatureCollection", "features": features}
        resp = HttpResponse(json.dumps(geojson, indent=2), content_type="application/geo+json")
        resp["Content-Disposition"] = 'attachment; filename="measurements.geojson"'
        return resp


class XmlExport(ExportStrategy):
    """Export measurements in XML format.

    This class implements the `export` method to handle XML export of measurement data.

    Parameters
    ----------
    ExportStrategy : Abstract Base Class
        Inherits from the abstract base class `ExportStrategy`.

    Methods
    -------
    export(data)
        Given serialized data, return an HttpResponse with XML content.
    """

    def export(self, data):
        """Export the given data to XML format.

        Parameters
        ----------
        data : list
            List of serialized measurement data to be exported.

        Returns
        -------
        HttpResponse
            HTTP response containing the exported data in XML format.
        """
        root = Element("measurements")
        for item in data:
            m = SubElement(root, "measurement")
            for k, v in item.items():
                if k == "location":
                    loc = SubElement(m, "location")
                    SubElement(loc, "latitude").text = str(v["latitude"])
                    SubElement(loc, "longitude").text = str(v["longitude"])
                elif k == "metrics":
                    mets = SubElement(m, "metrics")
                    for met in v:
                        me = SubElement(mets, "metric")
                        for mk, mv in met.items():
                            SubElement(me, mk).text = str(mv)
                else:
                    SubElement(m, k).text = "" if v is None else str(v)
        xml_bytes = prettify_xml(root)
        resp = HttpResponse(xml_bytes, content_type="application/xml")
        resp["Content-Disposition"] = 'attachment; filename="measurements.xml"'
        return resp


def prettify_xml(element: ET.Element) -> bytes:
    """Return a pretty-printed XML byte string for the given Element.

    Uses minidom to indent the XML.

    Parameters
    ----------
    element : ET.Element
        The XML element to be pretty-printed.

    Returns
    -------
    bytes
        Pretty-printed XML as a byte string.
    """
    rough_string = ET.tostring(element, "utf-8")
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ", encoding="utf-8")
