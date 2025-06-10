"""Strategies for exporting measurements in different formats."""

import csv
import json
import logging
import time
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from xml.dom import minidom

from django.http import HttpResponse, JsonResponse, StreamingHttpResponse

logger = logging.getLogger("WATERWATCH")


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
        Given serialized data, return an HttpResponse or StreamingHttpResponse for the data iterable.
    """

    @abstractmethod
    def export(self, data, extra_data=None):
        """
        Return an HttpResponse or StreamingHttpResponse for the given data iterable.

        Parameters
        ----------
        data : QuerySet or iterable
            The main data to be exported.
        extra_data : dict, optional
            A dictionary containing supplementary data. For measurements, this is
            expected to hold a 'metrics' key with a dictionary mapping
            measurement IDs to their list of metrics.
        """


class CsvExport(ExportStrategy):
    """Exports measurement data in CSV format, supporting both streaming and non-streaming responses.

    This class defines the interface for exporting measurements in CSV format.

    Parameters
    ----------
    ExportStrategy : ABC
        Abstract base class for defining abstract methods and properties.

    Methods
    -------
    export(data, extra_data=None)
        Given serialized data, return an HttpResponse or StreamingHttpResponse for the data iterable.
        If `data` is a QuerySet, it will be streamed; otherwise, it will be built as a full CSV.
    """

    def export(self, data, extra_data=None):
        """Export the given data as a CSV file.

        Parameters
        ----------
        data : QuerySet or iterable
            The main data to be exported.
        extra_data : dict, optional
            A dictionary containing supplementary data such as 'metrics' and 'campaigns'.

        Returns
        -------
        HttpResponse or StreamingHttpResponse
            The response containing the exported CSV data.
        """
        if hasattr(data, "iterator") and callable(data.iterator):
            return self._stream_csv(data, extra_data)
        return self._build_csv(list(data), extra_data)

    def _get_metrics_for_row(self, row_id, metrics_dict):
        if metrics_dict:
            return metrics_dict.get(row_id, [])
        return []

    def _get_campaigns_for_row(self, row_id, campaigns_dict):
        if campaigns_dict:
            return campaigns_dict.get(row_id, [])
        return []

    def _build_csv(self, rows, extra_data=None):
        resp = HttpResponse(content_type="text/csv")
        resp["Content-Disposition"] = 'attachment; filename="measurements.csv"'
        writer = csv.writer(resp)
        if not rows:
            return resp

        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})

        # Add metrics to each row before writing
        for row in rows:
            row["metrics"] = self._get_metrics_for_row(row.get("id"), metrics_dict)
            row["campaigns"] = self._get_campaigns_for_row(row.get("id"), campaigns_dict)

        # Write header and rows
        writer.writerow(rows[0].keys())
        for row in rows:
            writer.writerow([json.dumps(v, default=str) if isinstance(v, dict | list) else v for v in row.values()])
        return resp

    def _stream_csv(self, qs, extra_data=None):
        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})

        class Echo:
            def write(self, v):
                return v

        pseudo = Echo()
        writer = csv.writer(pseudo)

        def rowgen():
            start = time.time()
            first = True
            # Use a larger chunk_size as the query is now much simpler
            for row in qs.iterator(chunk_size=500):
                # Add metrics to the row dictionary
                row["metrics"] = self._get_metrics_for_row(row.get("id"), metrics_dict)
                row["campaigns"] = self._get_campaigns_for_row(row.get("id"), campaigns_dict)

                if first:
                    yield writer.writerow(row.keys())
                    first = False

                yield writer.writerow(
                    [json.dumps(v, default=str) if isinstance(v, dict | list) else v for v in row.values()]
                )

            end = time.time()
            logger.debug("Actual streaming and Python-side data merging took %.3fs", end - start)

        return StreamingHttpResponse(rowgen(), content_type="text/csv")


class JsonExport(ExportStrategy):
    """Exports measurement data in JSON format, supporting both streaming and non-streaming responses.

    This class defines the interface for exporting measurements in JSON format.

    Parameters
    ----------
    ExportStrategy : ABC
        Abstract base class for defining abstract methods and properties.

    Methods
    -------
    export(data, extra_data=None)
        Given serialized data, return an HttpResponse or StreamingHttpResponse for the data iterable.
        If `data` is a QuerySet, it will be streamed; otherwise, it will be built as a full JSON response.
    """

    def export(self, data, extra_data=None):
        """Export the given data as a JSON file.

        Parameters
        ----------
        data : QuerySet or iterable
            The main data to be exported.
        extra_data : dict, optional
            A dictionary containing supplementary data such as 'metrics' and 'campaigns'.

        Returns
        -------
        HttpResponse or StreamingHttpResponse
            The response containing the exported JSON data.
        """
        if hasattr(data, "iterator") and callable(data.iterator):
            return self._stream_json(data, extra_data)

        # Non-streaming fallback
        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})
        full_data = list(data)
        for obj in full_data:
            obj["metrics"] = metrics_dict.get(obj.get("id"), [])
            obj["campaigns"] = campaigns_dict.get(obj.get("id"), [])
        return JsonResponse(full_data, safe=False, json_dumps_params={"indent": 2})

    def _stream_json(self, qs, extra_data=None):
        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})

        def gen():
            yield "[\n"
            first = True
            for obj in qs.iterator(chunk_size=500):
                if not first:
                    yield ",\n"

                # Add metrics to the object before serializing
                obj["metrics"] = metrics_dict.get(obj.get("id"), [])
                obj["campaigns"] = campaigns_dict.get(obj.get("id"), [])

                yield json.dumps(obj, indent=2, default=str)
                first = False
            yield "\n]\n"

        return StreamingHttpResponse(gen(), content_type="application/json")


class GeoJsonExport(ExportStrategy):
    """Exports measurement data in GeoJSON format, supporting both streaming and non-streaming responses.

    This class defines the interface for exporting measurements in GeoJSON format.

    Parameters
    ----------
    ExportStrategy : ABC
        Abstract base class for defining abstract methods and properties.

    Methods
    -------
    export(data, extra_data=None)
        Given serialized data, return an HttpResponse or StreamingHttpResponse for the data iterable.
        If `data` is a QuerySet, it will be streamed; otherwise, it will be built as a full GeoJSON response.
    """

    def export(self, data, extra_data=None):
        """Export the given data as a GeoJSON file.

        Parameters
        ----------
        data : QuerySet or iterable
            The main data to be exported.
        extra_data : dict, optional
            A dictionary containing supplementary data such as 'metrics' and 'campaigns'.

        Returns
        -------
        HttpResponse or StreamingHttpResponse
            The response containing the exported GeoJSON data.
        """
        if hasattr(data, "iterator") and callable(data.iterator):
            return self._stream_geojson(data, extra_data)

        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})
        features = []
        for item in data:
            item["metrics"] = metrics_dict.get(item.get("id"), [])
            item["campaigns"] = campaigns_dict.get(item.get("id"), [])
            features.append(self._feature(item))

        geojson = {"type": "FeatureCollection", "features": [f for f in features if f]}
        resp = HttpResponse(json.dumps(geojson, indent=2, default=str), content_type="application/geo+json")
        resp["Content-Disposition"] = 'attachment; filename="measurements.geojson"'
        return resp

    def _feature(self, item):
        longitude = item.get("longitude")
        latitude = item.get("latitude")

        if longitude is None or latitude is None:
            return None

        return {
            "type": "Feature",
            "properties": {k: v for k, v in item.items() if k not in ("latitude", "longitude")},
            "geometry": {
                "type": "Point",
                "coordinates": [float(longitude), float(latitude)],
            },
        }

    def _stream_geojson(self, qs, extra_data=None):
        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})

        def gen():
            yield '{"type":"FeatureCollection","features":[\n'
            first = True
            for item in qs.iterator(chunk_size=500):
                # Add metrics before creating the feature
                item["metrics"] = metrics_dict.get(item.get("id"), [])
                item["campaigns"] = campaigns_dict.get(item.get("id"), [])

                feature = self._feature(item)
                if feature is None:
                    continue

                if not first:
                    yield ",\n"

                yield json.dumps(feature, indent=2, default=str)
                first = False
            yield "\n]}\n"

        resp = StreamingHttpResponse(gen(), content_type="application/geo+json")
        resp["Content-Disposition"] = 'attachment; filename="measurements.geojson"'
        return resp


class XmlExport(ExportStrategy):
    """Exports measurement data in XML format, supporting both streaming and non-streaming responses.

    This class defines the interface for exporting measurements in XML format.

    Parameters
    ----------
    ExportStrategy : ABC
        Abstract base class for defining abstract methods and properties.

    Methods
    -------
    export(data, extra_data=None)
        Given serialized data, return an HttpResponse or StreamingHttpResponse for the data iterable.
        If `data` is a QuerySet, it will be streamed; otherwise, it will be built as a full XML response.
    """

    def export(self, data, extra_data=None):
        """Export the given data as an XML file.

        Always builds the full XML tree to avoid streaming complexities.
        """
        # Determine rows from either a QuerySet-like object or iterable
        if hasattr(data, "iterator") and callable(data.iterator):
            # Consume the iterator to build full list
            rows = list(data.iterator(chunk_size=500))
        else:
            # Fallback for any iterable like list
            rows = list(data)

        return self._build_xml(rows, extra_data)

    def _build_xml(self, rows, extra_data=None):
        metrics_dict = (extra_data or {}).get("metrics", {})
        campaigns_dict = (extra_data or {}).get("campaigns", {})

        root = ET.Element("measurements")
        for item in rows:
            # inject metrics & campaigns lists
            item_id = item.get("id")
            item["metrics"] = metrics_dict.get(item_id, [])
            item["campaigns"] = campaigns_dict.get(item_id, [])

            meas_elem = ET.SubElement(root, "measurement")
            self._append_measurement(meas_elem, item)

        xml_bytes = prettify_xml(root)
        resp = HttpResponse(xml_bytes, content_type="application/xml")
        resp["Content-Disposition"] = 'attachment; filename="measurements.xml"'
        return resp

    def _append_measurement(self, parent, item):
        # 1) Metrics block
        if item.get("metrics"):
            mets = ET.SubElement(parent, "metrics")
            for met in item["metrics"]:
                me = ET.SubElement(mets, "metric")
                for mk, mv in met.items():
                    ET.SubElement(me, mk).text = "" if mv is None else str(mv)

        # 2) Campaigns block
        if item.get("campaigns"):
            camps = ET.SubElement(parent, "campaigns")
            for camp_name in item["campaigns"]:
                ce = ET.SubElement(camps, "campaign")
                ce.text = str(camp_name)

        # 3) Other simple fields (except geom coords handled below)
        for k, v in item.items():
            if k in ("metrics", "campaigns", "latitude", "longitude"):
                continue
            elem = ET.SubElement(parent, k)
            elem.text = "" if v is None else str(v)

        # 4) Always append latitude & longitude last (if present)
        if "latitude" in item:
            ET.SubElement(parent, "latitude").text = str(item["latitude"])
        if "longitude" in item:
            ET.SubElement(parent, "longitude").text = str(item["longitude"])


def prettify_xml(element: ET.Element) -> bytes:
    """Prettify an XML ElementTree element.

    This function converts an XML ElementTree element to a pretty-printed XML string.

    Parameters.
    ----------
    element : ET.Element
        The XML ElementTree element to be prettified.

    Returns
    -------
    bytes
        A pretty-printed XML string in bytes format.
    """
    rough = ET.tostring(element, "utf-8")
    reparsed = minidom.parseString(rough)
    return reparsed.toprettyxml(indent="  ", encoding="utf-8")
