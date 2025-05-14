import { nextTick, type Ref } from 'vue'


export function validateTime(
  errors: {
    mins: string | null
    sec: string | null
    temp: string | null
    sensor: string | null
  },
  time: {
    mins: string
    sec: string
  },
  refs: {
    mins: Ref<HTMLInputElement | undefined>
    sec: Ref<HTMLInputElement | undefined>
  }
) {

    const isValidNum = (val: string) => /^\d+$/.test(val) && +val >= 0 && +val <= 59

    const minsValid = isValidNum(time.mins)
    const secValid = isValidNum(time.sec)

    if (!minsValid && time.mins !== '') {
        errors.mins = 'Enter a number 0-59'
        nextTick(() => refs.mins.value?.focus())
        return
    } else if(secValid){
        errors.mins = null
    }else if(!minsValid){
        errors.mins = 'Enter a number 0-59'
        nextTick(() => refs.mins.value?.focus())
        return
    }

    if (!secValid && time.sec !== '') {
        errors.sec = 'Enter a number 0-59'
        nextTick(() => refs.sec.value?.focus())
        return
    } else if(minsValid){
        errors.sec = null
    }else if(!minsValid){
        errors.sec = 'Enter a number 0-59'
        nextTick(() => refs.sec.value?.focus())
        return
    }

    if (minsValid && secValid && +time.mins === 0 && +time.sec === 0) {
        errors.mins = 'Must wait at least 1 second'
        errors.sec = 'Must wait at least 1 second'
        nextTick(() => refs.sec.value?.focus())
    }
}


export function validateTemp(val: string,  errors: {
        mins: string | null
        sec: string | null
        temp: string | null
        sensor: string | null
        }, tempRef: Ref<HTMLInputElement | undefined>) {
  if (!/^-?\d+(\.\d+)?$/.test(val)) {
    errors.temp = 'Enter a number'
    nextTick(() => tempRef?.value?.focus())
  } else {
    errors.temp = null
  }
}

export function onSensorInput(sensor: string, errors: {
        mins: string | null
        sec: string | null
        temp: string | null
        sensor: string | null
        }) {
  if (sensor === '') {
    errors.sensor = 'Sensor type is required'
  } else {
    errors.sensor = null
  }
}

export function validateInputs(longitude: number | undefined,
    latitude: number | undefined,
    water_source: string,
    sensor: string,
    tempVal: string,
    selectedMetrics: string[],
    errors: {
    mins: string | null
    sec: string | null
    temp: string | null
    sensor: string | null
  },
){
    if(longitude === undefined || latitude === undefined || water_source === ''
        ){
            return false
        }
    if(selectedMetrics.includes('temperature')){
        if((sensor === ''
        || tempVal === '' || isNaN(Number(tempVal)))
        || errors.mins !== null || errors.sec !== null
        || errors.temp !== null || errors.sensor !== null){
            return false
        }
    }
    return true
}

export function createPayload(tempUnit: string,selectedMetrics: string[], temperature: {
    sensor: string;
    value: number;
    timeWaited: string;
},tempVal: string, time: {
            mins: string,
            sec: string
        },waterSource: string, longitude: number | undefined, latitude: number | undefined){

    if(selectedMetrics.includes('temperature')){
        if(tempUnit === 'F'){
        temperature.value = Math.round(((+tempVal - 32) * (5/9)) * 10)/10
        }else{
            temperature.value = Math.round(+tempVal * 10) / 10
        }
        const mins = time.mins
        const secs = time.sec
        const mm = String(mins).padStart(2, '0');
        const ss = String(secs).padStart(2, '0');
        temperature.timeWaited = `00:${mm}:${ss}`;
    }

    return {
        location: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        waterSource: waterSource,
        temperature: temperature
    }
}
