import {Schema, SchemaDefinition, SchemaTypeOpts, Types} from 'mongoose'
import {getSchema, validators} from './index'
import {Constructor, Fn, getMongooseMeta, IMongooseClass, mongooseMeta, Prototype} from './meta'
import {getType} from './util'

export function prop<T>(options: SchemaTypeOpts<T> & {type?: T} = {},
  type?: SchemaDefinition['type']): PropertyDecorator {
  return (target: Prototype, name: string) => {
    const pathSchema = getMongooseMeta(target).schema[name] || {}
    type = type || pathSchema['type']
    if (!type && !options.type) {
      type = getType(target, name)
      if (type['prototype']?.[mongooseMeta] && !pathSchema['type']) {
        type = getSchema(type as IMongooseClass)
      }
    }
    getMongooseMeta(target).schema[name] = {...pathSchema, ...options, ...type ? {type} : {}}
  }
}

export function array<T extends unknown>(type?: T, options?: SchemaTypeOpts<T[]>) {
  return (target: Prototype, name: string): void => {
    let t
    if (type?.['prototype']?.[mongooseMeta]) {
      t = getSchema(type as unknown as IMongooseClass)
    }
    if (type?.['type']?.['prototype']?.[mongooseMeta]) {
      type['type'] = getSchema(type['type'] as IMongooseClass)
    }
    const path = getMongooseMeta(target).schema[name]
    if (!type) type = path['type'] as T
    if (type === Types.ObjectId) {
      t = Schema.Types.ObjectId
    }
    t = t ?? type
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], ...options, type: [t]}
  }
}

export function id(): PropertyDecorator {
  return (target: Prototype, name: string) => {/* empty */}
}

export function required(): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], required: true}
  }
}

export function indexed(): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], index: true}
  }
}

export function hidden(): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], select: false}
  }
}

export function unique(): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], unique: true}
  }
}

export function defaults<T>(value: T): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], default: value}
  }
}

export function type(type: Prototype): PropertyDecorator {
  return (target: unknown, name: string) => {
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], type}
  }
}

export function enums(values: Array<string | number> | Record<string | number, string | number>): PropertyDecorator {
  return (target: Prototype, name: string) => {
    if (!Array.isArray(values)) {
      values = Object.values(values)
    }
    getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], enum: values}
  }
}

type LazyClass = () => Constructor

export function ref(nameOrClass: string | LazyClass, idType: unknown)
export function ref(nameOrClass: IMongooseClass, idType?: unknown)
export function ref(nameOrClass: string | IMongooseClass | LazyClass, idType?: unknown): PropertyDecorator {
  if (typeof nameOrClass === 'string') {
    return (target: unknown, name: string) => {
      getMongooseMeta(target).schema[name] = {...getMongooseMeta(target).schema[name], ref: nameOrClass, type: idType}
    }
  } else if ('prototype' in nameOrClass && !!nameOrClass.prototype.constructor.name) {
    return (target: unknown, name: string) => {
      const field = getMongooseMeta(target).schema[name] || {}
      const isArray = Array.isArray(field['type'])
      if (field['type'] === undefined || idType || isArray && field['type'][0] === undefined) {
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
    return (target: Prototype, name: string) => {
      const field = getMongooseMeta(target).schema[name] || {}
      const isArray = Array.isArray(field['type'])
      if (isArray && !Array.isArray(idType)) {
        idType = [idType]
      }
      if (field['type'] === undefined || idType || isArray && field['type'][0] === undefined) {
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

export function refArray(nameOrClass: string | LazyClass | IMongooseClass, elementType: unknown): PropertyDecorator {
  if (typeof nameOrClass === 'string') {
    return (target: unknown, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{type: [elementType], ref: nameOrClass}],
      }
    }
  } else if ('prototype' in nameOrClass && !!nameOrClass.prototype.constructor.name) {
    return (target: unknown, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{type: [elementType], ref: getMongooseMeta(nameOrClass.prototype).name}],
      }
    }
  } else {
    return (target: unknown, name: string) => {
      getMongooseMeta(target).schema[name] = {
        ...getMongooseMeta(target).schema[name],
        type: [{
          type: [elementType],
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

export function statics(): PropertyDecorator {
  return (target: Constructor, name: string) => {
    getMongooseMeta(target.prototype).statics[name] = target[name]
  }
}

export function query(): PropertyDecorator {
  return (target: Constructor, name: string) => {
    getMongooseMeta(target.prototype).queries[name] = target[name]
  }
}

export function methods(): PropertyDecorator {
  return (target: Prototype, name: string) => {
    getMongooseMeta(target).methods[name] = target[name] as Fn
  }
}

export function virtual(): MethodDecorator {
  return (target: Prototype, name: string, descriptor: PropertyDescriptor) => {
    getMongooseMeta(target).virtuals[name] = descriptor
  }
}

export function mongoId<T>(options: SchemaTypeOpts<T> & {type?: T} = {}, type?: T): PropertyDecorator {
  options = {validate: validators.mongoId, ...options}
  return prop(options, type)
}
