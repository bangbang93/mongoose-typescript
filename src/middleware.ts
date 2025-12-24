import {Aggregate, Document, Model, Query} from 'mongoose'
import {Fn, getMongooseMeta} from './meta'

export type HookType = 'pre' | 'post'
type DocumentMiddlewareType = 'validate' | 'save' | 'remove' | 'init'
type QueryMiddlewareType = 'count' | 'find' | 'findOne' | 'findOneAndRemove' | 'findOneAndUpdate' | 'update'
| 'updateOne' | 'updateMany'
type AggregateMiddlewareType = 'aggregate'
type ModelMiddlewareType = 'insertMany'

export type ActionType = DocumentMiddlewareType | QueryMiddlewareType | AggregateMiddlewareType
| ModelMiddlewareType


type R<T> = T | Promise<T>
type DocumentHookFunction = (this: Document, error?: Error, doc?: Document, next?: Fn) => R<unknown>
type QueryHookFunction = (this: Query<unknown, unknown>, error?: Error, doc?: Query<unknown, unknown>,
  next?: Fn,
) => R<unknown>
type AggregateHookFunction = (this: Aggregate<unknown>, error?: Error, doc?: Aggregate<unknown>,
  next?: Fn,
) => R<unknown>
type ModelHookFunction = (this: Model<Document>, error?: Error, doc?: Model<Document>, next?: Fn) => R<unknown>
type HookFunction = DocumentHookFunction | QueryHookFunction | AggregateHookFunction | ModelHookFunction


export function middleware(actionType: DocumentMiddlewareType, hookType: HookType,
  hookFunction: DocumentHookFunction,
): ClassDecorator
export function middleware(actionType: QueryMiddlewareType, hookType: HookType,
  hookFunction: QueryHookFunction,
): ClassDecorator
export function middleware(actionType: AggregateMiddlewareType, hookType: HookType,
  hookFunction: AggregateHookFunction,
): ClassDecorator
export function middleware(actionType: ModelMiddlewareType, hookType: HookType,
  hookFunction: ModelHookFunction,
): ClassDecorator
export function middleware(actionType: ActionType, hookType: HookType,
  hookFunction: HookFunction,): ClassDecorator {
  return (target): void => {
    getMongooseMeta(target.prototype)
      .middleware
      .push([actionType, hookType, hookFunction])
  }
}
