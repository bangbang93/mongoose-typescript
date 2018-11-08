import {Document, model, Model as mongooseModel, Schema, Types} from 'mongoose'
import 'reflect-metadata'

import {ActionType, Fn, getMongooseMeta, HookType, IMongooseClass, MongooseMeta} from './meta'

export * from './model'
export * from './schema'
export * from './model-helper'

export type DocumentType<T> = T & Document
export type ModelType<T> = mongooseModel<DocumentType<T>> & T
export type Ref<T> = Types.ObjectId | DocumentType<T>

const modelCache = new WeakMap<IMongooseClass, ModelType<IMongooseClass>>()
const schemaCache = new WeakMap<MongooseMeta, Schema>()

export function getSchema(modelClass: IMongooseClass): Schema {
  const meta = getMongooseMeta(modelClass.prototype)
  if (schemaCache.has(meta)) {
    return schemaCache.get(meta)
  }

  const schema = buildSchema(meta)
  schemaCache.set(meta, schema)
  return schema
}

export function getModel<T extends IMongooseClass>(
  modelClass: InstanceType<T>): ModelType<InstanceType<T>> & InstanceType<T> {

  if (modelCache.has(modelClass)) {
    return modelCache.get(modelClass) as any
  }
  const meta = getMongooseMeta(modelClass.prototype)
  const newModel = model(meta.name, buildSchema(meta))
  modelCache.set(modelClass, newModel as any)
  return newModel as any
}

function buildSchema(meta: MongooseMeta): Schema {
  const schema = new Schema(meta.schema, meta.options)

  Object.keys(meta.statics)
    .forEach((name) => {
      schema.statics[name] = meta.statics[name]
  })

  Object.keys(meta.methods)
    .forEach((name) => {
      schema.methods[name] = meta.methods[name]
    })

  Object.keys(meta.queries)
    .forEach((name) => {
      schema.query[name] = meta.queries[name]
    })

  Object.keys(meta.virtuals)
    .forEach((name) => {
      const virtual = schema.virtual(name)
      const descriptor = meta.virtuals[name]

      if (descriptor.get) virtual.get(descriptor.get)

      if (descriptor.set) virtual.set(descriptor.set)
    })

  meta.indexes.forEach(({fields, options}) => {
    schema.index(fields, options)
  })

  meta.hooks.forEach(([hookType, actionType, fn]: [HookType, ActionType, Fn]) => {
    schema[hookType](actionType, fn)
  })

  return schema
}
