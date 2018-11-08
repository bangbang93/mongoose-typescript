import {SchemaOptions} from 'mongoose'
import {Fn, getMongooseMeta, IIndexArgs, IMongooseClass} from './meta'

export function model(name: string, options?: SchemaOptions) {
  return (target: IMongooseClass) => {
    const meta = getMongooseMeta(target.prototype)
    meta.name = name

    meta.options = options
  }
}

export function index(fields: IIndexArgs['fields'], options?: IIndexArgs['options']) {
  return (target: any) => {
    getMongooseMeta(target.prototype).indexes
      .push({fields, options})
  }
}

export function subModel(options: SchemaOptions & {name?: string} = {}) {
  return (target: IMongooseClass) => {
    const meta = getMongooseMeta(target.prototype)

    if (options._id === undefined) {
      options._id = false
    }
    meta.name = options.name
    meta.options = options
  }
}

export function hook(hookType: string, actionType: string, hookFunction: Fn) {
  return (target: any, name: string) => {
    getMongooseMeta(target.prototype).hooks
                                     .push([hookType, actionType, hookFunction])
  }
}
