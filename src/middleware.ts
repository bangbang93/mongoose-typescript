import {Aggregate, Document, Model, Query} from 'mongoose'
import {DocumentType} from './index'
import {Fn, getMongooseMeta} from './meta'

export type HookType = 'pre' | 'post'
interface IDocumentMiddleware {
  validate: HookType
  save: HookType
  remove: HookType
  init: HookType
}
interface IQueryMiddleware {
  count: HookType
  find: HookType
  findOne: HookType
  findOneAndRemove: HookType
  findOneAndUpdate: HookType
  update: HookType
  updateOne: HookType
  updateMany: HookType
}
interface IAggregateMiddleware {
  aggregate: HookType
}
interface IModelMiddleware {
  insertMany: HookType
}
export type MiddlewareType = IDocumentMiddleware & IQueryMiddleware & IAggregateMiddleware & IModelMiddleware
export type ActionType = keyof MiddlewareType

type R<T> = T | Promise<T>
type DocumentHookFunction<T> = (this: DocumentType<T>, error?: Error, doc?: DocumentType<T>, next?: Fn) => R<any>
type QueryHookFunction<T> = (this: Query<T>, error?: Error, doc?: Query<T>, next?: Fn) => R<any>
type AggregateHookFunction<T> = (this: Aggregate<T>, error?: Error, doc?: Aggregate<T>, next?: Fn) => R<any>
type ModelHookFunction<T extends Document> = (this: Model<T>, error?: Error, doc?: Model<T>, next?: Fn) => R<any>

export function middleware<T>(actionType: keyof IDocumentMiddleware, hookType: HookType,
                              hookFunction: DocumentHookFunction<T>)
export function middleware<T>(actionType: keyof IQueryMiddleware, hookType: HookType,
                              hookFunction: QueryHookFunction<T>)
export function middleware<T>(actionType: keyof IAggregateMiddleware, hookType: HookType,
                              hookFunction: AggregateHookFunction<T>)
export function middleware<T extends Document>(actionType: keyof IModelMiddleware, hookType: HookType,
                                               hookFunction: ModelHookFunction<T>)
export function middleware(actionType: ActionType, hookType: HookType, hookFunction: Fn) {
  return (target: any, name: string) => {
    getMongooseMeta(target.prototype).middleware
      .push([actionType, hookType, hookFunction])
  }
}
