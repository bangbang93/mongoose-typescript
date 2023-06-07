import {Schema, Types} from 'mongoose'

export function getType(target: object, name: string): unknown {
  const type = Reflect.getMetadata('design:type', target, name)
  if (type === Types.ObjectId) {
    return Schema.Types.ObjectId
  } else {
    return type
  }
}
