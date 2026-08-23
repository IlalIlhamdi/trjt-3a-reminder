/**
 * TRJT 3A REMINDER — Time Provider Abstraction
 * Supports RealJakartaTimeProvider (Production) and FakeTimeProvider (Developer Sandbox)
 */

(function () {
  'use strict';

  /**
   * Real Jakarta Time Provider (Production)
   * Timezone: Asia/Jakarta (WIB, UTC+7)
   */
  class RealJakartaTimeProvider {
    constructor() {
      this.timeZone = 'Asia/Jakarta';
    }

    now() {
      // Return a Date object representing current time in Asia/Jakarta
      const now = new Date();
      // Use Intl to get formatted Jakarta date parts
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: this.timeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false
        });
        const parts = formatter.formatToParts(now);
        const map = {};
        parts.forEach(p => { map[p.type] = p.value; });
        return new Date(
          parseInt(map.year, 10),
          parseInt(map.month, 10) - 1,
          parseInt(map.day, 10),
          parseInt(map.hour, 10),
          parseInt(map.minute, 10),
          parseInt(map.second, 10)
        );
      } catch (e) {
        return now;
      }
    }

    isSimulated() {
      return false;
    }
  }

  /**
   * Fake Time Provider (Development Simulator Sandbox)
   * Does NOT alter device clock or trigger production FCM
   */
  class FakeTimeProvider {
    constructor(initialDate = null) {
      this.currentSimulatedTime = initialDate ? new Date(initialDate) : new Date();
      this.speedMultiplier = 1;
    }

    setTime(date) {
      this.currentSimulatedTime = new Date(date);
    }

    setSpeedMultiplier(multiplier) {
      this.speedMultiplier = multiplier;
    }

    advanceSeconds(seconds = 1) {
      if (this.currentSimulatedTime) {
        this.currentSimulatedTime = new Date(this.currentSimulatedTime.getTime() + (seconds * 1000 * this.speedMultiplier));
      }
    }

    now() {
      return new Date(this.currentSimulatedTime);
    }

    isSimulated() {
      return true;
    }
  }

  // Export to global scope
  window.RealJakartaTimeProvider = RealJakartaTimeProvider;
  window.FakeTimeProvider = FakeTimeProvider;
})();
