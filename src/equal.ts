import isEqual from 'lodash-es/isEqual';
import isEqualWith from 'lodash-es/isEqualWith';

export function equal<T extends object, U extends object>(
  obj1: T,
  obj2: U,
): boolean {
  function customizer<V1, V2>(
    value1: V1,
    value2: V2,
    key: PropertyKey | undefined,
  ): boolean | undefined {
    if (key === undefined) {
      return undefined;
    }

    if (
      typeof value1 === 'object' &&
      value1 !== null &&
      typeof value2 === 'object' &&
      value2 !== null
    ) {
      const keys1 = Object.keys(value1).sort();
      const keys2 = Object.keys(value2).sort();

      if (isEqual(keys1, keys2)) {
        return true;
      } else {
        return false;
      }
    }

    return true;
  }

  return isEqualWith(obj1, obj2, customizer);
}
