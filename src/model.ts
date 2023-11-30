import {IndexDirection, IndexOptions, SchemaOptions} from 'mongoose'
import {getMongooseMeta, IPluginArgs} from './meta'

export function model(name: string, options?: SchemaOptions): ClassDecorator {
  return (target): void => {
    const meta = getMongooseMeta(target.prototype)
    meta.name = name
    meta.options = options
    meta.clazz = target
  }
}

export function index(fields: Record<string, IndexDirection>, options?: IndexOptions): ClassDecorator {
  return (target): void => {
    getMongooseMeta(target.prototype).indexes
      .push({fields, options})
  }
}

export function subModel(options: SchemaOptions & {name?: string} = {}): ClassDecorator {
  return (target): void => {
    const meta = getMongooseMeta(target.prototype)

    if (options._id === undefined) {
      options._id = false
    }
    if (options.name) {
      meta.name = options.name
    }
    meta.options = options
    meta.clazz = target.prototype
  }
}

export function plugin<T>(plugin: IPluginArgs<T>['plugin'], options?: IPluginArgs<T>['options']): ClassDecorator {
  return (target): void => {
    getMongooseMeta(target.prototype).plugins
      .push({plugin: plugin as any, options})
  }
}
