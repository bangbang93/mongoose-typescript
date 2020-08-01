import {Aggregate, Document, Model, Query} from 'mongoose'
import {DocumentType} from './index'
import {Fn, getMongooseMeta, IMongooseClass} from './meta'

export type HookType = 'pre' | 'post'
type DocumentMiddlewareType = 'validate' | 'save' | 'remove' | 'init'
type QueryMiddlewareType = 'count' | 'find' | 'findOne' | 'findOneAndRemove' | 'findOneAndUpdate' | 'update'
| 'updateOne' | 'updateMany'
type AggregateMiddlewareType = 'aggregate'
type ModelMiddlewareType = 'insertMany'

export type ActionType = DocumentMiddlewareType | QueryMiddlewareType | AggregateMiddlewareType
| ModelMiddlewareType


type R<T> = T | Promise<T>
type DocumentHookFunction<T> = (this: DocumentType<T>, error?: Error, doc?: DocumentType<T>, next?: Fn) => R<unknown>
type QueryHookFunction<T> = (this: Query<T>, error?: Error, doc?: Query<T>, next?: Fn) => R<unknown>
type AggregateHookFunction<T> = (this: Aggregate<T>, error?: Error, doc?: Aggregate<T>, next?: Fn) => R<unknown>
type ModelHookFunction<T extends Document> = (this: Model<T>, error?: Error, doc?: Model<T>, next?: Fn) => R<unknown>
type HookFunction<T> = T extends Document ? ModelHookFunction<T>
  : DocumentHookFunction<T> | QueryHookFunction<T> | AggregateHookFunction<T>


export function middleware<T>(actionType: DocumentMiddlewareType, hookType: HookType,
  hookFunction: DocumentHookFunction<T>)
export function middleware<T>(actionType: QueryMiddlewareType, hookType: HookType,
  hookFunction: QueryHookFunction<T>)
export function middleware<T>(actionType: AggregateMiddlewareType, hookType: HookType,
  hookFunction: AggregateHookFunction<T>)
export function middleware<T extends Document>(actionType: ModelMiddlewareType, hookType: HookType,
  hookFunction: ModelHookFunction<T>)
export function middleware<T>(actionType: string, hookType: HookType, hookFunction: HookFunction<T>)
export function middleware<T>(actionType: ActionType, hookType: HookType, hookFunction: HookFunction<T>) {
  return (target: IMongooseClass): void => {
    getMongooseMeta(target.prototype).middleware
      .push([actionType, hookType, hookFunction])
  }
}
