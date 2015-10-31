/**
 * let tween = new Tween({});
 * tween.reset({})
 *      .to({})
 *      .on('update', function(){})
 *      .on('end', function(){});
 */
import FlatEvent from './flat-event';
import raf from 'raf';
import ease from './ease';
const STATUS = {
  INIT: 1,
  RUNNING: 2,
  STOPPED: 3,
  PAUSED: 4,
  RESUMED: 5,
  DONE: 6,
};
class Tween extends FlatEvent {
  constructor(from, easing, duration) {
    super();
    this.reset(from)
        .ease(easing)
        .duration(duration);
  }
  reset(from) {
    this.stop();
    this.from(from);
    this._curr = this._from; // no need a deep clone
    this._lasted = 0;
    this._status = STATUS.INIT;
    return this;
  }
  from (props) {
    this._from = props || this._from;
    return this;
  }
  to(props) {
    this._to = props || this._to;
    return this;
  }
  ease(fn = ease.outQuint) {
    fn = typeof fn === 'function' ? fn : ease[fn];
    if (!fn) throw new TypeError('invalid easing function');
    this._ease = fn;
    return this;
  }
  duration(ms = 1600) {
    this._duration = ms;
    return this;
  }
  step() {
    let progress = this._lasted / this._duration;
    if (progress >= 1) {
      this._status = STATUS.DONE;
      this._curr = this._to;
      this.emit('update', this._curr);
      this.emit('done', this._curr);
    } else {
      let from = this._from, to = this._to, curr = this._curr = {};
      let factor = this._ease(progress);
      for (let prop in from) {
        curr[prop] = from[prop] + (to[prop] - from[prop]) * factor;
      }
      this.emit('update', curr);
    }
    return this;
  }
  stop() {
    raf.cancel(this._raf);
    this._status = STATUS.STOPPED;
    this.emit('stop', this._curr);
    return this;
  }
  pause() {
    raf.cancel(this._raf);
    this._status = STATUS.PAUSED;
    this.emit('pause', this._curr);
    return this;
  }
  iterate() {
    let lasted = Date.now() - this._latest + this._lasted;
    if (lasted >= this._duration) {
      this._lasted = this._duration;
    } else {
      this._lasted = lasted;
      this._latest = Date.now();
      this._raf = raf(::this.iterate);
    }
    return this.step();
  }
  resume(p) {
    if (this._status === STATUS.RUNNING) return;
    if (p) this._lasted = p * this._duration;
    this._status = STATUS.RUNNING;
    this._latest = Date.now();
    return this.iterate();
  }
  start() {
    this.resume(0) && (this._start = this._latest);
    return this;
  }
}
Tween.ease = ease;

export default Tween;