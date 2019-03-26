import {Schema, SchemaOptions} from 'mongoose'
import {ActionType, HookType} from './middleware'

export type Fn = (...args: any[]) => any

export interface IIndexArgs {
  fields: any,
  options: {
    expires?: string;
    [other: string]: any;
  }
}

export type IPluginType<T> = (schema: Schema, options?: T) => void

export interface IPluginArgs<T> {
  plugin: IPluginType<T>
  options?: T
}

export class MongooseMeta {

  public name: string
  public schema: any = {}
  public statics: {[name: string]: Fn} = {}
  public methods: {[name: string]: Fn} = {}
  public virtuals: {[name: string]: PropertyDescriptor} = {}
  public queries: {[name: string]: Fn} = {}
  public indexes: IIndexArgs[] = []
  public middleware: Array<[ActionType, HookType, Fn]> = []
  public plugins: Array<IPluginArgs<any>> = []

  public options: SchemaOptions = null
}

export interface IMongooseClass extends Object {
  __mongooseMeta__?: MongooseMeta

  new(...args: any[]): any
}

export function getMongooseMeta(target: IMongooseClass): MongooseMeta {
  if (!target.__mongooseMeta__) {
    target.__mongooseMeta__ = new MongooseMeta()
  }

  return target.__mongooseMeta__
}
