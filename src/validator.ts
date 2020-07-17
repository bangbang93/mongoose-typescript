import is from '@sindresorhus/is'
import {ObjectId} from './index'

export default {
  get mongoId() {
    return (value: unknown): boolean => {
      if (is.nullOrUndefined(value)) return true
      if (is.string(value) || is.number(value)) {
        return ObjectId.isValid(value)
      }
      if (is.directInstanceOf(value, ObjectId)) {
        return ObjectId.isValid(value)
      }
      return ObjectId.isValid(String.prototype.toString.call(value))
    }
  },
}
