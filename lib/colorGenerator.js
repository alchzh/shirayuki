import hsluv from "hsluv";

// Golden Ratio
// See rationale here: http://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/
const phi = 1.6180339887498948482;
const step = 1.0 / phi;

export default function* colorGenerator(seed) {
  let hue = seed || Math.random();

  while (true) {
    yield hsluv.hsluvToHex([hue * 360, 100, 65]);
    hue = (hue + step) % 1;
  }
}
