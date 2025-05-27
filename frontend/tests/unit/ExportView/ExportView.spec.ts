// import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
// import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
// const fakeFetch = vi.fn();
// vi.stubGlobal("fetch", fakeFetch);
// import ExportView from "../../../src/views/ExportView.vue";
// import { nextTick, ref } from "vue";
// const pushMock = vi.fn();
// vi.mock("vue-router", () => ({
//     useRouter: () => ({ push: pushMock }),
// }));

// vi.mock("universal-cookie", () => {
//     return {
//         default: class {
//             get() {
//                 return "dummy";
//             }
//         },
//     };
// });
// const mockResults = ref<{ id: number; name: string }[]>([])
// const mockHasSearched = ref(false)
// const mockSearchMeasurements = vi.fn(async (params) => {
//   mockHasSearched.value = true
//   mockResults.value = [{ id: 1, name: 'foo' }]
// })
// vi.mock('@/composables/useSearch', () => ({
//   useSearch: () => ({
//     results: mockResults,
//     hasSearched: mockHasSearched,
//     searchMeasurements: mockSearchMeasurements
//   })
// }))

// let mockExportOk: boolean = true
// const mockExportData = vi.fn(async () => mockExportOk)
// vi.mock('@/composables/useExportData', () => ({
//   useExportData: () => ({ exportData: mockExportData })
// }))

// // 2) Stub child components
// const FilterPanelStub = {
//   template: '<div/>',
//   // will be overwritten per–test if needed
//   methods: {
//     getSearchParams: () => ({ q: 'stub' })
//   }
// }
// const SearchBarStub    = { template: '<div/>' }
// const SearchResultsStub = { template: '<div/>' }

// describe('SearchPage.vue', () => {
//   let wrapper: ReturnType<typeof mount>

//   beforeEach(() => {
//     // Mock filterPanelRef to avoid property error
//     mockResults.value = []
//     mockHasSearched.value = false
//     mockSearchMeasurements.mockReset()
//     mockExportData.mockReset()

//     wrapper = mount(ExportView, {
//       global: {
//         stubs: {
//           SearchBar: SearchBarStub,
//           FilterPanel: FilterPanelStub,
//           SearchResults: SearchResultsStub
//         }
//       }
//     })

//   })

//   it('onSearch calls searchMeasurements with filter params and resets filtersOutOfSync', async () => {
//     (wrapper.vm as any).filterPanelRef = FilterPanelStub

//     // 1) Prepare stub getSearchParams and query
//     const stubParams = { foo: 'bar' }
//     const fp = wrapper.findComponent(FilterPanelStub)
//     // @ts-ignore
//     fp.vm.getSearchParams = () => stubParams

//     // 2) Set the query and call onSearch
//     await wrapper.setData({ query: 'hello' })
//     await (wrapper.vm as any).onSearch()
//     await flushPromises()

//     // 3) Assert useSearch was invoked correctly
//     expect(mockSearchMeasurements).toHaveBeenCalledOnce()
//     expect(mockSearchMeasurements).toHaveBeenCalledWith(stubParams)

//     // 4) lastSearchParams should update, and filtersOutOfSync should be false
//     expect((wrapper.vm as any).lastSearchParams).toEqual(stubParams)
//     expect((wrapper.vm as any).filtersOutOfSync).toBe(false)
//   })

//   it('watch marks filtersOutOfSync when filters change after a search', async () => {
//     // 1) First do a search so hasSearched = true and lastSearchParams set
//     (wrapper.vm as any).filterPanelRef = FilterPanelStub

//     const initial = { a: 1 }
//     // @ts-ignore
//     wrapper.findComponent(FilterPanelStub).vm.getSearchParams = () => initial
//     await (wrapper.vm as any).onSearch()
//     await flushPromises()
//     expect((wrapper.vm as any).hasSearched).toBe(true)

//     // 2) Now change the stub to return a different params object
//     const changed = { a: 2 }
//     // @ts-ignore
//     wrapper.findComponent(FilterPanelStub).vm.getSearchParams = () => changed

//     // 3) Force the watch to run
//     await nextTick()

//     expect((wrapper.vm as any).filtersOutOfSync).toBe(true)
//   })

//   it('onDownload shows modal on export failure, hides on success', async () => {
//     // 1) Ensure lastSearchParams something
//     (wrapper.vm as any).lastSearchParams = { test: true }

//     // 2) Export failure
//     mockExportOk = false
//     await (wrapper.vm as any).onDownload()
//     expect(mockExportData).toHaveBeenCalledWith('csv', { test: true })
//     expect((wrapper.vm as any).showModal).toBe(true)

//     // 3) Export success
//     mockExportOk = true
//     (wrapper.vm as any).showModal = false
//     await (wrapper.vm as any).onDownload()
//     expect((wrapper.vm as any).showModal).toBe(false)
//   })
// })
