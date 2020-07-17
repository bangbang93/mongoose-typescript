import {IndexOptions} from 'mongodb'
import {SchemaOptions} from 'mongoose'
import {getMongooseMeta, IMongooseClass, IPluginArgs} from './meta'

export function model(name: string, options?: SchemaOptions) {
  return (target: IMongooseClass): void => {
    const meta = getMongooseMeta(target.prototype)
    meta.name = name

    meta.options = options
  }
}

export function index(fields: Record<string, unknown>, options?: IndexOptions) {
  return (target: IMongooseClass): void => {
    getMongooseMeta(target.prototype).indexes
      .push({fields, options})
  }
}

export function subModel(options: SchemaOptions & {name?: string} = {}) {
  return (target: IMongooseClass): void => {
    const meta = getMongooseMeta(target.prototype)

    if (options._id === undefined) {
      options._id = false
    }
    meta.name = options.name
    meta.options = options
  }
}

export function plugin<T>(plugin: IPluginArgs<T>['plugin'], options?: IPluginArgs<T>['options']) {
  return (target: IMongooseClass): void => {
    getMongooseMeta(target.prototype).plugins
      .push({plugin, options})
  }
}
