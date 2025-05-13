// import { describe, it, test, expect, beforeEach, vi } from 'vitest'
// import { nextTick } from 'vue'
// import {
//   time,
//   errors,
//   tempVal,
//   formData,
//   minsRef,
//   secRef,
//   tempRef,
//   validateMins,
//   validateSec,
//   validateTemp,
//   onMinsInput,
//   onSecInput,
//   onTempInput,
//   onSensorInput,
//   clear
// } from '../../src/components/MeasurementComponent.vue'

// async function flush() {
//     await nextTick()
// }


// beforeEach(() => {
//     time.mins = ''
//     time.sec = ''
//     tempVal.value = ''
//     formData.metrics[0].sensor = ''
//     Object.assign(errors, {mins: null, sec:null, temp: null, sensor: null})

//     minsRef.value = { focus: vi.fn() } as any
//     secRef.value = { focus: vi.fn() } as any
//     tempRef.value = { focus: vi.fn() } as any
// })

// test('validationMinsTest', () => {
//     it('rejects non-numeric input', async () => {
//         validateMins('abc')
//         expect(errors.mins).toBe('Please enter a valid number')
//         await flush()
//         expect(minsRef.value!.focus).toHaveBeenCalled()
// })

// })
