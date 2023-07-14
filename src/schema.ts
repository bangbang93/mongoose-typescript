import lodash from 'lodash'
import {DefaultType, SchemaTypeOptions} from 'mongoose'
import {Class, Constructor} from 'type-fest'
import {getSchema, validators} from './index'
import {getMongooseMeta, hasMongooseMeta} from './meta'
import {getType} from './util'

export function prop<T>(options: SchemaTypeOptions<T> = {},
  type?: SchemaTypeOptions<unknown>['type']): PropertyDecorator {
  return (target: object, name: string | symbol) => {
    if (typeof name === 'symbol') {
      throw new Error('Symbol is not supported as property name')
    }
    const pathSchema = getMongooseMeta(target).schema[name] || {} as SchemaTypeOptions<T>
    type = type ?? pathSchema.type ?? options.type
    if (!type) {
      type = getType(target, name) as object
    }
    if (typeof type === 'function' && 'prototype' in type) {
      if (hasMongooseMeta(type.prototype) && !pathSchema['type']) {
        type = getSchema(type as Class<unknown>)
      }
    }
    getMongooseMeta(target).schema[name] = {...pathSchema, ...options, ...type ? {type} : {}} as any
  }
}

export function array<T extends Constructor<unknown> | Array<unknown>>(type: T, options?: SchemaTypeOptions<T[]>) {
  return (target: object, name: string): void => {
    let t
    if (typeof type === 'function') {
      if (hasMongooseMeta(type.prototype)) {
        t = getSchema(type)
      }
    }
    t = t ?? type
    getMongooseMeta(target).schema[name]
      = {...getMongooseMeta(target).schema[name], ...options, type: t ? [t] : []} as any
  }
}

export function id(): PropertyDecorator {
  return () => {/* empty */}
}

export function required() {
  return (target: object, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], required: true}
  }
}

export function indexed() {
  return (target: object, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], index: true}
  }
}

export function hidden() {
  return (target: object, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], select: false}
  }
}

export function unique() {
  return (target: object, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], unique: true}
  }
}

export function defaults<T extends DefaultType<unknown>>(value: T | null | undefined) {
  return (target: object, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], default: value}
  }
}

export function type(type: Constructor<unknown>) {
  return (target: object, name: string) => {
    if (typeof type === 'object' && type !== null) {
      if (hasMongooseMeta(type)) {
        const schema = getSchema(type)
        getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], type: schema}
        return
      }
    }
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], type}
  }
}

type EnumValue = string | number | null
export function enums<T extends EnumValue>(values: Array<T> | Record<string | number, T>, allowNull = false) {
  return (target: object, name: string) => {
    if (!Array.isArray(values)) {
      values = Object.values(values)
    }
    if (allowNull) {
      values.push(null as unknown as T)
    }
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], enum: values}
  }
}

type LazyClass = () => Constructor<unknown>

export function ref(nameOrClass: string | LazyClass, idType: unknown): (target: object, name: string) => void
export function ref(nameOrClass: Constructor<unknown>, idType?: unknown): (target: object, name: string) => void
export function ref(nameOrClass: string | Constructor<unknown> | LazyClass,
  idType?: unknown): (target: object, name: string) => void {
  if (typeof nameOrClass === 'string') {
    return (target: object, name: string) => {
      getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], ref: nameOrClass, type: idType}
    }
  } else if ('prototype' in nameOrClass && !!nameOrClass.prototype.constructor.name) {
    return (target: object, name: string) => {
      if (nameOrClass === undefined) {
        throw new Error(`${target.constructor.name}.${name} reference type is undefined, maybe circular dependence`)
      }
      const field = getMongooseMeta(target).schema[name] || {}
      const isArray = Array.isArray(field['type'])
      if (field['type'] === undefined || idType || isArray && (lodash.get(field, 'type') as any)?.[0] === undefined) {
        const type = idType || getType(nameOrClass.prototype, '_id')
        if (!type) {
          throw new Error(`cannot get type for ref ${target.constructor.name}.${name} `
                          + `to ${nameOrClass.constructor.name}._id`)
        }
        if (isArray) {
          field['type'] = [type]
        } else {
          field['type'] = type
        }
      }
      getMongooseMeta(target).schema[name] = {...field, ref: getMongooseMeta(nameOrClass.prototype).name}
    }
  } else {
    return (target: object, name: string) => {
      const field = getMongooseMeta(target).schema[name] || {}
      const isArray = Array.isArray(field['type'])
      if (isArray && !Array.isArray(idType)) {
        idType = [idType]
      }
      if (field['type'] === undefined || idType || isArray && (lodash.get(field, 'type') as any)?.[0] === undefined) {
        getMongooseMeta(target).schema[name] = {...field,
          type: idType,
          ref: () => {
            const clazz = (nameOrClass as LazyClass)()
            const type = idType || getType(clazz.prototype, '_id')
            if (!type) {
              throw new Error(`cannot get type for ref ${target.constructor.name}.${name} `
                              + `to ${clazz.constructor.name}._id`)
            }
            return getMongooseMeta(clazz.prototype).name
          }}
      }
    }
  }
}

export function refArray(nameOrClass: string | LazyClass | Constructor<unknown>, elementType: unknown) {
  if (typeof nameOrClass === 'string') {
    return (target: object, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{type: elementType, ref: nameOrClass}],
      }
    }
  } else if ('prototype' in nameOrClass && !!nameOrClass.prototype.constructor.name) {
    return (target: object, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{type: elementType, ref: getMongooseMeta(nameOrClass.prototype).name}],
      }
    }
  } else {
    return (target: object, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{
          type: elementType,
          ref: () => {
            const clazz = (nameOrClass as LazyClass)()
            const type = elementType || getType(clazz.prototype, '_id')
            if (!type) {
              throw new Error(`cannot get type for ref ${target.constructor.name}.${name} `
                              + `to ${clazz.constructor.name}._id`)
            }
            return getMongooseMeta(clazz.prototype).name
          },
        }],
      }
    }
  }
}

export function statics() {
  return (target: Class<unknown>, name: string, descriptor: PropertyDescriptor) => {
    getMongooseMeta(target.prototype).statics[name] = descriptor.value
  }
}

export function query() {
  return (target: object, name: string, descriptor: PropertyDescriptor) => {
    getMongooseMeta(target).queries[name] = descriptor.value
  }
}

export function methods() {
  return (target: object, name: string, descriptor: PropertyDescriptor) => {
    getMongooseMeta(target).methods[name] = descriptor.value
  }
}

export function virtual() {
  return (target: object, name: string, descriptor: PropertyDescriptor) => {
    if (descriptor.value) {
      if (typeof descriptor.value !== 'function') {
        throw new TypeError('virtual can only used on class method or getter/setter')
      }
    }
    getMongooseMeta(target).virtuals[name] = descriptor
  }
}

export function mongoId<T>(options: SchemaTypeOptions<T> = {}, type?: T): PropertyDecorator {
  options = {validate: validators.mongoId, ...options}
  return prop(options, type)
}
