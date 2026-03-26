/** Min-Max Decimation for LOD (Level of Detail). */

export function decimateMinMax(
  timeData: number[],
  valueData: number[],
  factor: number,
): { time: number[]; value: number[] } {
  if (factor <= 1 || timeData.length === 0) {
    return { time: timeData, value: valueData };
  }

  const resultTime: number[] = [];
  const resultValue: number[] = [];

  for (let i = 0; i < timeData.length; i += factor) {
    const end = Math.min(i + factor, timeData.length);

    let minVal = valueData[i];
    let maxVal = valueData[i];
    let minIdx = i;
    let maxIdx = i;

    for (let j = i + 1; j < end; j++) {
      if (valueData[j] < minVal) {
        minVal = valueData[j];
        minIdx = j;
      }
      if (valueData[j] > maxVal) {
        maxVal = valueData[j];
        maxIdx = j;
      }
    }

    if (minIdx < maxIdx) {
      resultTime.push(timeData[minIdx], timeData[maxIdx]);
      resultValue.push(minVal, maxVal);
    } else {
      resultTime.push(timeData[maxIdx], timeData[minIdx]);
      resultValue.push(maxVal, minVal);
    }
  }

  return { time: resultTime, value: resultValue };
}
