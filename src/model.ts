import {SchemaOptions} from 'mongoose'
import {getMongooseMeta, IIndexArgs, IMongooseClass, IPluginArgs} from './meta'

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

export function plugin<T>(plugin: IPluginArgs<T>['plugin'], options?: IPluginArgs<T>['options']) {
  return (target: any) => {
    getMongooseMeta(target.prototype).plugins
      .push({plugin, options})
  }
}
