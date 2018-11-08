import {SchemaOptions} from 'mongoose'

export type Fn = (...args: any[]) => any

export type HookType = 'pre' | 'post' | string
export type ActionType = 'save' | 'find' | string

export interface IIndexArgs {
  fields: any,
  options: {
    expires?: string;
    [other: string]: any;
  }
}

export class MongooseMeta {

  public name: string
  public schema: any = {}
  public statics: {[name: string]: Fn} = {}
  public methods: {[name: string]: Fn} = {}
  public virtuals: {[name: string]: PropertyDescriptor} = {}
  public queries: {[name: string]: Fn} = {}
  public indexes: IIndexArgs[] = []
  public hooks: Array<[HookType, ActionType, Fn]> = []

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
