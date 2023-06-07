import {IndexDirection, IndexOptions, Schema, SchemaOptions, SchemaTypeOptions} from 'mongoose'
import {Constructor} from 'type-fest'
import {ActionType, HookType} from './middleware'

export type Fn = () => unknown

export interface IIndexArgs {
  fields: Record<string, IndexDirection>
  options?: IndexOptions
}

export type IPluginType<T> = (schema: Schema, options?: T) => void

export interface IPluginArgs<T> {
  plugin: IPluginType<T>
  options?: T
}

export class MongooseMeta {
  public name!: string
  public schema: Record<string, SchemaTypeOptions<unknown>> = {}
  public statics: {[name: string]: Fn} = {}
  public methods: {[name: string]: Fn} = {}
  public virtuals: {[name: string]: PropertyDescriptor} = {}
  public queries: {[name: string]: Fn} = {}
  public indexes: IIndexArgs[] = []
  public middleware: Array<[ActionType, HookType, Fn]> = []
  public plugins: Array<IPluginArgs<unknown>> = []

  public options?: SchemaOptions = undefined
}

const mongooseMeta = Symbol('MongooseMeta')

export function setMongooseMeta(target: object, meta: Partial<MongooseMeta>): void {
  const exists = Reflect.getMetadata(mongooseMeta, target) ?? new MongooseMeta()
  Reflect.defineMetadata(mongooseMeta, {...exists, ...meta}, target)
}

export function getMongooseMeta(target: object): MongooseMeta {
  const metadata = Reflect.getMetadata(mongooseMeta, target)
  if (metadata) return metadata
  const meta = new MongooseMeta()
  Reflect.defineMetadata(mongooseMeta, meta, target)
  return meta
}

export function hasMongooseMeta(target: object): target is Constructor<unknown> {
  return Reflect.hasMetadata(mongooseMeta, target)
}
