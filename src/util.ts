import {Schema, Types} from 'mongoose'

export function getType(target: any, name: string) {
  const type = Reflect.getMetadata('design:type', target, name)
  if (type === Types.ObjectId) {
    return Schema.Types.ObjectId
  } else {
    return type
  }
}
