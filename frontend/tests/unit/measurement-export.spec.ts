import {
  exportData,
  format,
} from "../../src/composables/MeasurementExportLogic.ts";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { nextTick, ref, type Ref } from "vue";

vi.mock("file-saver", () => {
  return {
    saveAs: vi.fn(),
  };
});

import * as fileSaver from "file-saver";

class MockResponse {
  constructor(public ok: boolean, private _blob: Blob, public status = 200) {}
  blob() {
    return Promise.resolve(this._blob);
  }
}

describe("exportData", () => {

  beforeEach(() => {
    // reset format
    format.value = "csv";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls saveAs on successful fetch", async () => {
    // arrange: mock fetch to return OK with CSV blob
    const csv = "id,value\n1,42";
    const blob = new Blob([csv], { type: "text/csv" });
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    ) as any;

    const successful = await exportData();

    expect(successful).toBe(true);
    expect(fileSaver.saveAs).toHaveBeenCalledOnce();
    expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
  });

  it("alerts on non-ok response", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new MockResponse(false, new Blob(), 500))
    ) as any;
    const successful = await exportData();
    expect(successful).toBe(false);
    expect(fileSaver.saveAs).not.toHaveBeenCalled();
  });

  it("alerts on fetch error", async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error("Network"))) as any;
    const successful = await exportData();
    expect(successful).toBe(false);
    expect(fileSaver.saveAs).not.toHaveBeenCalled();
  });
  it("incorporates format.value into the fetch URL", async () => {
    const blob = new Blob(["dummy"], { type: "text/csv" });
    const mockFetch = vi.fn(() =>
      Promise.resolve(new MockResponse(true, blob))
    );
    global.fetch = mockFetch as any;

    format.value = "csv";
    let successful = await exportData();
    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/measurements/?format=csv",
      expect.objectContaining({ method: "GET" })
    );

    format.value = "json";
    successful = await exportData();
    expect(successful).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/measurements/?format=json",
      expect.objectContaining({ method: "GET" })
    );
  }),
    it("calls fetch with the correct options", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new MockResponse(true, new Blob()));
      global.fetch = mockFetch as any;

      const successful = await exportData();
      expect(successful).toBe(true);
      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/measurements/?format=csv",
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
    }),
    it("still calls saveAs when format is xml", async () => {
      format.value = "xml";
      const blob = new Blob(
        [
          /* binary data */
        ],
        {
          type: "application/xml",
        }
      );
      global.fetch = vi.fn(() =>
        Promise.resolve(new MockResponse(true, blob))
      ) as any;

      const successful = await exportData();
      expect(successful).toBe(true);
      expect(fileSaver.saveAs).toHaveBeenCalledOnce();
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.xml");
    }),
    it("calls saveAs even if blob.type is incorrect", async () => {
      const blob = new Blob(["<html>oops</html>"], { type: "text/html" });
      global.fetch = vi.fn(() =>
        Promise.resolve(new MockResponse(true, blob))
      ) as any;

      const successful = await exportData();
      expect(successful).toBe(true);
      expect(fileSaver.saveAs).toHaveBeenCalledOnce();
      expect(fileSaver.saveAs).toHaveBeenCalledWith(blob, "water-data.csv");
    }),
    it("supports multiple sequential calls", async () => {
      const blob1 = new Blob(["a"], { type: "text/csv" });
      const blob2 = new Blob(["b"], { type: "text/csv" });
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(new MockResponse(true, blob1))
        .mockResolvedValueOnce(new MockResponse(true, blob2)) as any;

      const successful = await exportData() && await exportData();
      expect(successful).toBe(true);
      expect(fileSaver.saveAs).toHaveBeenCalledTimes(2);

      expect(fileSaver.saveAs).toHaveBeenNthCalledWith(
        1,
        blob1,
        "water-data.csv"
      );
      expect(fileSaver.saveAs).toHaveBeenNthCalledWith(
        2,
        blob2,
        "water-data.csv"
      );
    }),
    it("handles a delayed fetch gracefully", async () => {
      let resolveFetch: any;
      global.fetch = vi.fn(
        () =>
          new Promise((r) => {
            resolveFetch = r;
          })
      ) as any;

      const promise = exportData();
      // simulate delay
      await new Promise((r) => setTimeout(r, 50));
      resolveFetch(new MockResponse(true, new Blob(["delayed"])));
      const successful = await promise;
      expect(successful).toBe(true);

      expect(fileSaver.saveAs).toHaveBeenCalledOnce();
      expect(fileSaver.saveAs).toHaveBeenCalled();
    }),
    it("handles large CSV payloads", async () => {
      const largeData = "x,".repeat(1e6);
      const blob = new Blob([largeData], { type: "text/csv" });
      global.fetch = vi.fn(() =>
        Promise.resolve(new MockResponse(true, blob))
      ) as any;

      const successful = await exportData();
      expect(successful).toBe(true);
      expect(fileSaver.saveAs).toHaveBeenCalled();
    });
});
