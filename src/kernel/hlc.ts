export interface HLCState {
  lastMillis: number;
  counter: number;
}

export function nextHLC(now: number, state: HLCState, deviceId: string): [string, HLCState] {
  let { lastMillis, counter } = state;

  if (now > lastMillis) {
    lastMillis = now;
    counter = 0;
  } else {
    // Clock went backwards or multiple events in the same millisecond
    counter++;
  }

  // versionString = zero-padded millis(15) + '-' + padded counter(4) + '-' + deviceId
  const millisString = lastMillis.toString().padStart(15, '0');
  const counterString = counter.toString().padStart(4, '0');
  const versionString = `${millisString}-${counterString}-${deviceId}`;

  return [versionString, { lastMillis, counter }];
}
