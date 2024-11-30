/*
EXAMPLE:

const timer = new ScopedTimer();

function foo(mult) {
    let a = 10;
    for (let i = 0; i < 100_000_000; i++) {
        a *= mult;
    }
    return a;
}

const a = timer.measure(() => foo(0.9999999999));
*/
export class ScopedTimer {
  constructor(averaged = false, ticks_per_update = 5) {
    this.dt = 0;

    this.averaged = averaged;
    this.ticks_per_update = ticks_per_update;
    this.ticks = 0;
    this.time_sum = 0;
  }

  /**
   * The time "foo" takes is stored in this.dt as SECONDS.
   * @param {Function} foo Can be void or not.
   * @returns void or whatever foo returns
   */
  measure(foo) {
    const st = performance.now();
    const result = foo();
    const et = performance.now();
    const delta = isNaN(1e-3 * (et - st)) ? 1 / 60 : 1e-3 * (et - st);

    if (this.averaged) {
      if (this.ticks >= this.ticks_per_update) {
        this.ticks = 0;
        this.dt = this.sum / this.ticks_per_update;
        this.sum = 0;
      } else {
        this.ticks++;
        this.sum += delta;
      }
    } else {
      this.dt = delta;
    }

    return result;
  }
}

export class FPSCalculator {
  constructor(ticks_per_update = 5) {
    this.dt = 1 / 120;

    this.lasttime = 0;

    this.ticks_per_update = ticks_per_update;
    this.ticks = 0;
    this.time_sum = 0;
  }

  /**
   * The time "foo" takes is stored in this.dt as SECONDS.
   * @param {Function} foo Can be void or not.
   * @returns void or whatever foo returns
   */
  update() {
    const et = performance.now();
    let delta = 1e-3 * (et - this.lasttime);
    delta = isNaN(delta) || delta < 0.0001 ? this.dt : delta;

    if (this.ticks >= this.ticks_per_update) {
      this.ticks = 0;
      this.dt = this.sum / this.ticks_per_update;
      this.sum = 0;
    } else {
      this.ticks++;
      this.sum += delta;
    }

    this.lasttime = et;
  }
}
