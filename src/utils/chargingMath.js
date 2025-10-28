function calculateCabinetSlotPower(cabinetPowerCapacity, cabinetBatteryCapacity) {
  // cabinet_slot_power = cabinet_power_capacity / cabinet_battery_capacity
  return cabinetPowerCapacity / cabinetBatteryCapacity;
}

function calculateCabinetSlotChargeCurrent(cabinetSlotPower, batteryNominalVoltage) {
  // cabinet_slot_charge_current = cabinet_slot_power / battery_nominal_voltage
  return cabinetSlotPower / batteryNominalVoltage;
}

function calculateBatteryRatedChargeCurrent(batteryRatedPower, batteryNominalVoltage) {
  // battery_rated_charge_current = battery_rated_power / battery_nominal_voltage
  return batteryRatedPower / batteryNominalVoltage;
}

function calculateICCCurrent(cabinetSlotChargeCurrent, batteryRatedChargeCurrent) {
  // i_cc = min(cabinet_slot_charge_current / battery_rated_charge_current, 1)
  return Math.min(cabinetSlotChargeCurrent, batteryRatedChargeCurrent);
}

/**
 * CC phase: constant current
 * @param {number} SOC_start - state of charge start (0-1)
 * @param {number} SOC_target - state of charge target (0-1)
 * @param {number} batteryCapacity - in Ah
 * @param {number} i_cc - charging current in A
 * @returns {number} estimated time in hours
 */
function estimateCCTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  return (batteryCapacity * (SOC_target - SOC_start)) / i_cc;
}

/**
 * CV phase: constant voltage, decreasing current
 * Approximate using average current i_avg = i_cc / 2
 * @param {number} SOC_start - start SOC (0-1)
 * @param {number} SOC_target - target SOC (0-1)
 * @param {number} batteryCapacity - in Ah
 * @param {number} i_cc - CC current in A
 * @returns {number} estimated time in hours
 */
function estimateCVTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  const i_avg = i_cc / 2; // approximate average current
  return (batteryCapacity * (SOC_target - SOC_start)) / i_avg;
}

/**
 * Estimate total charge time from SOC_start to SOC_target
 * Assumes CC phase 0%-80%, CV phase 80%-100%
 * @param {number} SOC_start
 * @param {number} SOC_target
 * @param {number} batteryCapacity
 * @param {number} i_cc
 * @returns {number} total estimated time in hours
 */
function estimateTotalChargeTime(SOC_start, SOC_target, batteryCapacity, i_cc) {
  let time = 0;

  // CC phase (0%-80%)
  if (SOC_start < 0.8) {
    const SOC_CC_end = Math.min(SOC_target, 0.8);
    time += estimateCCTime(SOC_start, SOC_CC_end, batteryCapacity, i_cc);
    SOC_start = SOC_CC_end;
  }

  // CV phase (80%-100%)
  if (SOC_target > 0.8) {
    time += estimateCVTime(SOC_start, SOC_target, batteryCapacity, i_cc);
  }

  return time;
}

/**
 * Estimate target SOC given current SOC and charging duration
 * (inverse of estimateTotalChargeTime)
 * 
 * @param {number} SOC_start - current state of charge (0-1)
 * @param {number} batteryCapacity - in Ah
 * @param {number} i_cc - constant current (A)
 * @param {number} durationHours - how long the battery has been charging (in hours)
 * @returns {number} estimated SOC_target (0-1)
 */
function estimateSOCTarget(SOC_start, batteryCapacity, i_cc, durationHours) {
  let remainingTime = durationHours;
  let SOC = Math.max(0, Math.min(SOC_start, 1)); // clamp start value

  // CC phase (0%-80%)
  if (SOC < 0.8) {
    const SOC_CC_end = 0.8;
    const ccTime = (batteryCapacity * (SOC_CC_end - SOC)) / i_cc;

    if (remainingTime >= ccTime) {
      // CC phase fully completed
      SOC = SOC_CC_end;
      remainingTime -= ccTime;
    } else {
      // CC phase partially completed
      SOC += (remainingTime * i_cc) / batteryCapacity;
      return Math.max(0, Math.min(SOC, 1));
    }
  }

  // CV phase (80%-100%)
  if (SOC >= 0.8 && remainingTime > 0) {
    const i_avg = i_cc / 2; // approximate
    const deltaSOC = (remainingTime * i_avg) / batteryCapacity;
    SOC += deltaSOC;
  }

  // Clamp result between 0 and 1
  return Math.max(0, Math.min(SOC * 100, 100));
}

/**
 * Helper to compute SOC_target given a target timestamp
 * @param {Date} start - current timestamp
 * @param {Date} target - target timestamp
 * @param {number} SOC_start
 * @param {number} batteryCapacity - in Ah
 * @param {number} i_cc - charging current in A
 * @returns {number} estimated SOC_target (0-1)
 */
function estimateSOCTargetByTime(start, target, SOC_start, batteryCapacity, i_cc) {
  const durationHours = (target - start) / 3600000; // ms → hours
  return estimateSOCTarget(SOC_start, batteryCapacity, i_cc, durationHours);
}

module.exports = {
  calculateCabinetSlotPower,
  calculateCabinetSlotChargeCurrent,
  calculateBatteryRatedChargeCurrent,
  calculateICCCurrent,
  estimateTotalChargeTime,
  estimateSOCTarget,
  estimateSOCTargetByTime
};
