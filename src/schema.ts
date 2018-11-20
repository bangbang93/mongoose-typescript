import {SchemaTypeOpts} from 'mongoose'
import {getSchema} from './index'
import {getMongooseMeta, IMongooseClass} from './meta'
import {getType} from './util'

export function prop<T>(options: SchemaTypeOpts<T> & {type?: T} = {}, type?: T): PropertyDecorator {
  return (target: any, name: string) => {
    const pathSchema = getMongooseMeta(target).schema[name] || {}
    if (!type && !options.type) {
      type = getType(target, name)
      if (type['prototype'] && type['prototype'].__mongooseMeta__ && !pathSchema.type) {
        type = getSchema(type as any) as any
      }
    }
    getMongooseMeta(target).schema[name] = {...pathSchema, ...options, type}
  }
}

export function array<T>(type?: T, options?: SchemaTypeOpts<T>) {
  return (target: any, name: string) => {
    if (type && type['prototype'] && type['prototype'].__mongooseMeta__) {
      type = getSchema(type as any) as any
    }
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], ...options, type: [type]}
  }
}

export function id(target: any, name: string) {
  return
}

export function required(target: any, name: string) {
  getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], required: true}
}

export function indexed(target: any, name: string) {
  getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], index: true}
}

export function hidden(target: any, name: string) {
  getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], select: false}
}

export function unique(target: any, name: string) {
  getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], unique: true}
}

export function defaults<T>(value: T) {
  return (target: any, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], default: value}
  }
}

export function type(type: any) {
  return (target: any, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], type}
  }
}

export function enums(values: any[]) {
  return (target: any, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], enum: values}
  }
}

export function ref(nameOrClass: string | IMongooseClass, idType?: any) {
  if (typeof nameOrClass === 'string') {
    return (target: any, name: string) => {
      getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], ref: nameOrClass, type: idType}
    }
  } else {
    return (target: any, name: string) => {
      const field = getMongooseMeta(target).schema[name] || {}
      const isArray = Array.isArray(field.type)
      if (field.type === undefined || idType || (isArray && field.type[0] === undefined)) {
        const type = idType || getType(nameOrClass.prototype, '_id')
        if (!type) {
          throw new Error(`cannot get type for ref ${target.constructor.name}.${name} ` +
                                   `to ${nameOrClass.constructor.name}._id`)
        }
        if (isArray) {
          field.type = [type]
        } else {
          field.type = type
        }
      }
      getMongooseMeta(target).schema[name] = {...field,
                                              ref: getMongooseMeta(nameOrClass.prototype).name}
    }
  }
}

export function statics(target: any, name: string) {
  getMongooseMeta(target.prototype).statics[name] = target[name]
}

export function query(target: any, name: string) {
  getMongooseMeta(target.prototype).queries[name] = target[name]
}

export function methods(target: any, name: string) {
  getMongooseMeta(target).methods[name] = target[name]
}

export function virtual(target: any, name: string, descriptor: PropertyDescriptor) {
  getMongooseMeta(target).virtuals[name] = descriptor
}
