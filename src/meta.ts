import type {IndexOptions} from 'mongodb'
import {Schema, SchemaOptions, SchemaType, SchemaTypeOpts} from 'mongoose'
import {ActionType, HookType} from './middleware'

export type Fn = (...args: unknown[]) => unknown
export interface Constructor {
  prototype: Prototype
  new(...args: unknown[]): unknown
}
export type Prototype = unknown

export interface IIndexArgs {
  fields: Record<string, unknown>
  options: IndexOptions
}

export type PathDefinition<T = unknown> = SchemaTypeOpts<T> | Schema | SchemaType | {type?: T}

export type IPluginType<T> = (schema: Schema, options?: T) => void

export interface IPluginArgs<T> {
  plugin: IPluginType<T>
  options?: T
}

export class MongooseMeta {
  public name: string
  public schema: Record<string, PathDefinition> = {}
  public statics: {[name: string]: Fn} = {}
  public methods: {[name: string]: Fn} = {}
  public virtuals: {[name: string]: PropertyDescriptor} = {}
  public queries: {[name: string]: Fn} = {}
  public indexes: IIndexArgs[] = []
  public middleware: Array<[ActionType, HookType, Fn]> = []
  public plugins: Array<IPluginArgs<unknown>> = []

  public options: SchemaOptions = null
}

export const mongooseMeta = Symbol('MongooseMeta')

export interface IMongooseClass extends Object {
  [mongooseMeta]?: MongooseMeta

  new(...args: unknown[]): unknown
}

export function getMongooseMeta(target: unknown): MongooseMeta {
  if (!target[mongooseMeta]) {
    target[mongooseMeta] = new MongooseMeta()
  }

  return target[mongooseMeta]
}
