import {getSchedule, DATA} from '../script';
import {assert} from 'chai';

suite(`getSchedule`, () => {

  test(`should return object`, () => {
    // const result = getSchedule(DATA);

    const actual = typeof getSchedule(DATA);
    const expected =typeof {};

    assert.strictEqual(actual, expected);
  });
});