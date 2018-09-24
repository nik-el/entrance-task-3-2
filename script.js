const DATA = {
  devices: [
    {
      id: "F972B82BA56A70CC579945773B6866FB",
      name: "Посудомоечная машина",
      power: 950,
      duration: 3,
      mode: "night"
    },
    {
      id: "C515D887EDBBE669B2FDAC62F571E9E9",
      name: "Духовка",
      power: 2000,
      duration: 2,
      mode: "day"
    },
    {
      id: "02DDD23A85DADDD71198305330CC386D",
      name: "Холодильник",
      power: 50,
      duration: 24
    },
    {
      id: "1E6276CC231716FE8EE8BC908486D41E",
      name: "Термостат",
      power: 50,
      duration: 24
    },
    {
      id: "7D9DC84AD110500D284B33C82FE6E85E",
      name: "Кондиционер",
      power: 850,
      duration: 1
    }
  ],
  rates: [
    {
      from: 7,
      to: 10,
      value: 6.46
    },
    {
      from: 10,
      to: 17,
      value: 5.38
    },
    {
      from: 17,
      to: 21,
      value: 6.46
    },
    {
      from: 21,
      to: 23,
      value: 5.38
    },
    {
      from: 23,
      to: 7,
      value: 1.79
    }
  ],
  maxPower: 2100
};

const compareNumeric = (a, b) => {
  return a - b;
};

const comparePrice = (a, b) => {
  return a.intervalPrice - b.intervalPrice;
};

/**
 * Кажется, что в первую очеред должны браться устройства с максимальной мощностью
 */
const comparePower = (a, b) => {
  return b.power - a.power;
};

/**
 * Принимает начало и конец временного отрезка и возвращает массив часов
 * @param from
 * @param to
 * @returns {Array}
 */
const getIntervalFromRange = (from, to) => {
  const DAY_OVER = 24;
  let duration;

  if (from > to) {
    duration = DAY_OVER - from  + to;
  } else {
    duration = to - from;
  }

  const intervalPerHour = [];
  for (let currentTime = from; intervalPerHour.length < duration; ++currentTime) {
    if (currentTime >= DAY_OVER) {
      currentTime = 0 ;
    }
    intervalPerHour.push(currentTime);
  }

  return intervalPerHour;
};

/**Принимает тарифы
 * Возвращает объект час - стоимость килловата
 * @param rates
 * @returns Object
 */
const getValuePerHourFromRates = (rates) => {
  const valueRange = {};

  rates.forEach(rate => {
    const rateInterval = getIntervalFromRange(rate.from, rate.to);

    rateInterval.forEach(currentTime => {
      valueRange[currentTime] = rate.value;
    });
  });

  return valueRange;
};

/**
 * Выбирает из всех интервалов наименее затратный и одновременно доступный по максимальной мощности
 *
 * @param results
 * @param schedule
 * @param device
 * @param maxPower
 * @param consumedEnergy
 * @returns {{schedule: *, consumedEnergy: *}}
 */
const chooseBestCorrectInterval = (results, schedule, device, maxPower, consumedEnergy) => {
  if (device.power > maxPower) {
    alert(`Заявленная мощность устройства «${device.name}» выше максимальной. Оно не будет включено в раписание.`);
    return;
  }

  let isCorrect = false;

  for (const result of results) {
    for (const currentTime of result.interval) {

      if (!schedule[currentTime] || (schedule[currentTime] && (schedule[currentTime].power + device.power) <= maxPower)) {
        isCorrect = true;

        if (!schedule[currentTime]) {
          schedule[currentTime] = {
            ids: [],
            power: 0,
          };
        }

        schedule[currentTime].ids.push(device.id);
        schedule[currentTime].power += device.power;
      }
    }
    if (isCorrect) {
      const transformIntervalPrice = result.intervalPrice / 1000;
      consumedEnergy.devices[device.id] = transformIntervalPrice;
      consumedEnergy.value += transformIntervalPrice;
      return {schedule, consumedEnergy}
    }
  }

  alert(`Устройство «${device.name}» не может быть включено в расписание!`)
};

/**
 * Высчитывает возможные интервалы работы устройства и цену каждого интервала
 *
 * @param workMode
 * @param ratesValue
 * @param device
 * @returns {Array}
 */
const getDeviceIntervals = (workMode, ratesValue, device) => {

  let startDuration = 0;
  let endDuration = device.duration - 1;
  let minSumPrice = 0;
  let bestInterval = [];
  let deviceResults = [];

  for (startDuration; endDuration < workMode.length; startDuration++, endDuration++) {
    const currentInterval = workMode.slice(startDuration, endDuration + 1);
    let currentSummPrice = 0;
    currentInterval.forEach(currentTime => {
      currentSummPrice = currentSummPrice + ratesValue[currentTime] * device.power;
    });

    deviceResults.push({intervalPrice: currentSummPrice, interval: currentInterval});
    if (!minSumPrice || currentSummPrice < minSumPrice) {
      minSumPrice = currentSummPrice;
      bestInterval = currentInterval;
    }
  }
  deviceResults.sort(comparePrice);

  return deviceResults
};

/**
 * Принимает список устройств, тарифы и максимальную мощность.
 * Возвращает затраты энергии по каждом устройству и расписание работы.
 *
 * @param data
 * @returns {{schedule: Array, consumedEnergy: {value: number, devices: {}}}}
 */
const getSchedule = (data) => {

  const DEVICE_MODE = {
    night: [21, 22, 23, 0, 1, 2, 3, 4, 5, 6],
    day: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  };

  const ratesValue = getValuePerHourFromRates(data.rates);
  const schedule = {};
  const consumedEnergy = {
    value: 0,
    devices: {},
  };

  const devices = data.devices;
  const maxPower = data.maxPower;

  devices.sort(comparePower);
  devices.forEach(device => {
    let workMode = [];

    if (DEVICE_MODE[device.mode]) {
      workMode = DEVICE_MODE[device.mode];
    } else {
      for (const mode in DEVICE_MODE) {
        workMode = workMode.concat(DEVICE_MODE[mode]);
        workMode.sort(compareNumeric);
      }
    }

    const deviceResults = getDeviceIntervals(workMode, ratesValue, device);

    chooseBestCorrectInterval(deviceResults, schedule, device, maxPower, consumedEnergy);
  });

  consumedEnergy.value = +consumedEnergy.value.toFixed(3);
  const scheduleByIds = [];
  for (let currentTime in schedule) {
    scheduleByIds[currentTime] = schedule[currentTime].ids;
  }

  const resultSchedule = {
    schedule: scheduleByIds,
    consumedEnergy: consumedEnergy
  };

  console.log(resultSchedule);
  return resultSchedule;
};

// getSchedule(DATA);

export {getSchedule, DATA}
