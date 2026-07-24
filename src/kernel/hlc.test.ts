import { describe, expect, it } from 'vitest';
import { nextHLC } from './hlc';

describe('hlc kernel', () => {
  it('generates strictly increasing versions when clock goes backwards or freezes', () => {
    const deviceId = 'deviceA';
    let state = { lastMillis: 0, counter: 0 };
    
    // Time 100
    const [v1, nextState] = nextHLC(100, state, deviceId);
    state = nextState;
    expect(v1).toBe('000000000000100-0000-deviceA');

    // Time freezes at 100
    const [v2, nextState2] = nextHLC(100, state, deviceId);
    state = nextState2;
    expect(v2).toBe('000000000000100-0001-deviceA');
    expect(v2 > v1).toBe(true);

    // Time goes backwards to 50
    const [v3, nextState3] = nextHLC(50, state, deviceId);
    state = nextState3;
    expect(v3).toBe('000000000000100-0002-deviceA');
    expect(v3 > v2).toBe(true);

    // Time jumps to 200
    const [v4, nextState4] = nextHLC(200, state, deviceId);
    state = nextState4;
    expect(v4).toBe('000000000000200-0000-deviceA');
    expect(v4 > v3).toBe(true);
  });
  
  it('monotonicity across 1000 calls with frozen clock', () => {
    let state = { lastMillis: 1000, counter: 0 };
    let previousVersion = '';
    
    for (let i = 0; i < 1000; i++) {
      const [v, nextState] = nextHLC(1000, state, 'deviceA');
      state = nextState;
      
      if (previousVersion !== '') {
        expect(v > previousVersion).toBe(true);
      }
      previousVersion = v;
    }
    
    expect(previousVersion).toBe('000000000001000-1000-deviceA');
  });
});
