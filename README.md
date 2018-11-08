# mongoose-typescript
Build mongoose schema with typescript and decorator
## Model level Decorators

`@model(name: string, options?: SchemaOptions)`

`@index(fields: IIndexArgs['fields'], options?: IIndexArgs['options']`

`@subModel(options: SchemaOptions & {name?: string} = {})`

## Schema level Decorators

`@prop(options: SchemaTypeOpts<T> = {}, type?: T)` type is optional, mongoose-typescript will try to determined the type automatically

`@array(type?: T, options?: SchemaTypeOpts<T>)` because of typescript only mark the type as Array, so array field need set type manually, or using mixed

`@id` empty decorator, just for emit Reflect metadata for `_id`

`@required` set schema `{required: true}`

`@indexed` set schema `{index: true}`

`@hidden` set schema `{select: false}`

`@unique` set schema `{unique: false}`

`@type(type)` set schema `{type: type}`

`@defaults(value)` set schema `{default: value}`

`@ref(nameOrClass: string | IMongooseClass)` set schema `{ref: nameOrClass}`
if type isn't set, and the argument is class, `mongoose-typescript` will try to using the typeof `class._id`, if cannot determined the type, using `mongoose.Types.ObjectId`

`@statics` register statics method

`@methods` register instance method

`@query` register query helper

`@virtual` register virtual field

## APIDOC
<https://bangbang93.github.io/mongoose-typescript>
