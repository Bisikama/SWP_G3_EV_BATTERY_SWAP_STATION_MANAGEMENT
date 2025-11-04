/**
 * ================= CONSTANTS =================
 * SOC_MIN: Minimum state of charge (0%)
 * SOC_MAX: Maximum state of charge (100%)
 * CC_TO_CV_THRESHOLD: SOC threshold where CC phase ends and CV phase starts
 * CV_CURRENT_AVERAGE_FACTOR: Factor to approximate average current in CV phase
 */
const SOC_MIN = 0;                     
const SOC_MAX = 1.0;                   
const CC_TO_CV_THRESHOLD = 0.8;       
const CV_CURRENT_AVERAGE_FACTOR = 0.5; 

// ================= CALCULATIONS =================

/**
 * Calculate power per cabinet slot.
 * @param {number} cabinetPowerCapacity - total cabinet power capacity in watts
 * @param {number} cabinetBatteryCapacity - total number of batteries in cabinet
 * @returns {number} power per slot in watts
 */
function calculateCabinetSlotPower(cabinetPowerCapacity, cabinetBatteryCapacity) {
  return cabinetPowerCapacity / cabinetBatteryCapacity;
}

/**
 * Calculate charging current for a cabinet slot.
 * @param {number} cabinetSlotPower - power allocated to this slot in watts
 * @param {number} batteryNominalVoltage - battery nominal voltage in volts
 * @returns {number} slot charging current in amperes
 */
function calculateCabinetSlotChargeCurrent(cabinetSlotPower, batteryNominalVoltage) {
  return cabinetSlotPower / batteryNominalVoltage;
}

/**
 * Calculate maximum allowed constant current (ICC) for charging.
 * @param {number} cabinetSlotChargeCurrent - calculated slot charging current
 * @param {number} batteryRatedChargeCurrent - battery rated current
 * @returns {number} ICC current in amperes (the lower of the two)
 */
function calculateICCCurrent(cabinetSlotChargeCurrent, batteryRatedChargeCurrent) {
  return Math.min(cabinetSlotChargeCurrent, batteryRatedChargeCurrent);
}

// ================= CC / CV TIME ESTIMATION =================

/**
 * Estimate charging time for CC phase.
 * @param {number} SOC_start - starting state of charge (0~1)
 * @param {number} SOC_target - target state of charge (0~1)
 * @param {number} batteryCapacity - battery capacity in Ah
 * @param {number} i_cc - constant charging current in A
 * @returns {number} estimated charging time in hours
 */
function estimateCCTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  return (batteryCapacity * (SOC_target - SOC_start)) / i_cc;
}

/**
 * Estimate charging time for CV phase.
 * Approximates average current as i_cc * CV_CURRENT_AVERAGE_FACTOR
 * @param {number} SOC_start - starting SOC for CV phase
 * @param {number} SOC_target - target SOC for CV phase
 * @param {number} batteryCapacity - battery capacity in Ah
 * @param {number} i_cc - constant current used in CC phase
 * @returns {number} estimated charging time in hours
 */
function estimateCVTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  const i_avg = i_cc * CV_CURRENT_AVERAGE_FACTOR;
  return (batteryCapacity * (SOC_target - SOC_start)) / i_avg;
}

/**
 * Estimate total charge time from SOC_start to SOC_target.
 * Uses CC phase (0 ~ CC_TO_CV_THRESHOLD) and CV phase (CC_TO_CV_THRESHOLD ~ SOC_MAX)
 * @param {number} SOC_start - starting SOC
 * @param {number} SOC_target - target SOC
 * @param {number} batteryCapacity - battery capacity in Ah
 * @param {number} i_cc - constant current used in CC phase
 * @returns {number} estimated total charging time in hours
 */
function estimateTotalChargeTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  let time = 0;

  if (SOC_start < CC_TO_CV_THRESHOLD) {
    const SOC_CC_end = Math.min(SOC_target, CC_TO_CV_THRESHOLD);
    time += estimateCCTime(SOC_start, SOC_CC_end, batteryCapacity, i_cc);
    SOC_start = SOC_CC_end;
  }

  if (SOC_target > CC_TO_CV_THRESHOLD) {
    time += estimateCVTime(SOC_start, SOC_target, batteryCapacity, i_cc);
  }

  return time;
}

// ================= SOC ESTIMATION BY TIME =================

/**
 * Estimate SOC target after charging for a certain duration.
 * Handles CC phase (0 ~ CC_TO_CV_THRESHOLD) and CV phase (CC_TO_CV_THRESHOLD ~ SOC_MAX)
 * @param {number} SOC_start - current SOC (0~1)
 * @param {number} batteryCapacity - battery capacity in Ah
 * @param {number} i_cc - constant current in A
 * @param {number} durationHours - charging duration in hours
 * @returns {number} estimated SOC (0~1)
 */
function estimateSOCTarget(SOC_start, batteryCapacity, i_cc, durationHours) {
  let remainingTime = durationHours;
  let SOC = Math.max(SOC_MIN, Math.min(SOC_start, SOC_MAX));

  if (SOC < CC_TO_CV_THRESHOLD) {
    const SOC_CC_end = CC_TO_CV_THRESHOLD;
    const ccTime = (batteryCapacity * (SOC_CC_end - SOC)) / i_cc;

    if (remainingTime >= ccTime) {
      SOC = SOC_CC_end;
      remainingTime -= ccTime;
    } else {
      SOC += (remainingTime * i_cc) / batteryCapacity;
      return Math.min(Math.max(SOC, SOC_MIN), SOC_MAX);
    }
  }

  if (SOC >= CC_TO_CV_THRESHOLD && remainingTime > 0) {
    const i_avg = i_cc * CV_CURRENT_AVERAGE_FACTOR;
    const deltaSOC = (remainingTime * i_avg) / batteryCapacity;
    SOC += deltaSOC;
  }

  return Math.min(Math.max(SOC, SOC_MIN), SOC_MAX);
}

/**
 * Estimate SOC after charging for a duration defined by start and target timestamps.
 * @param {Date|number} start - start time (Date object or timestamp in ms)
 * @param {Date|number} target - target time (Date object or timestamp in ms)
 * @param {number} SOC_start - current SOC (0~1)
 * @param {number} batteryCapacity - battery capacity in Ah
 * @param {number} i_cc - constant current in A
 * @returns {number} estimated SOC (0~1)
 */
function estimateSOCTargetByTime(start, target, SOC_start, batteryCapacity, i_cc) {
  const durationHours = (target - start) / 3600000;
  return estimateSOCTarget(SOC_start, batteryCapacity, i_cc, durationHours);
}

// ================= CURRENT & VOLTAGE ESTIMATION =================

/**
 * Estimate charging current at a given SOC.
 * CC phase: constant i_cc
 * CV phase: decreases linearly to 0 at SOC_MAX
 * @param {number} SOC - state of charge (0~1)
 * @param {number} i_cc - constant current in A
 * @returns {number} instantaneous charging current in A
 */
function estimateChargingCurrent(SOC, i_cc) {
  SOC = Math.max(SOC_MIN, Math.min(SOC, SOC_MAX));

  if (SOC < CC_TO_CV_THRESHOLD) {
    return i_cc;
  }

  const ratio = (SOC_MAX - SOC) / (SOC_MAX - CC_TO_CV_THRESHOLD);
  return i_cc * Math.max(ratio, SOC_MIN);
}

/**
 * Estimate charging voltage at a given SOC.
 * CC phase: voltage rises from nominal to max
 * CV phase: voltage stays at max
 * @param {number} SOC - state of charge (0~1)
 * @param {number} nominalVoltage - battery nominal voltage in volts
 * @param {number} maxVoltage - battery max voltage at full charge
 * @returns {number} instantaneous charging voltage in volts
 */
function estimateChargingVoltage(SOC, nominalVoltage, maxVoltage) {
  SOC = Math.max(SOC_MIN, Math.min(SOC, SOC_MAX));

  if (SOC < CC_TO_CV_THRESHOLD) {
    const progress = (SOC - SOC_MIN) / (CC_TO_CV_THRESHOLD - SOC_MIN);
    return nominalVoltage + (maxVoltage - nominalVoltage) * progress;
  }

  return maxVoltage;
}

// ================= EXPORTS =================
module.exports = {
  calculateCabinetSlotPower,
  calculateCabinetSlotChargeCurrent,
  calculateICCCurrent,
  estimateTotalChargeTime,
  estimateSOCTarget,
  estimateSOCTargetByTime,
  estimateChargingCurrent,
  estimateChargingVoltage
};
