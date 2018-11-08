## Model level Decorators

`@model(name: string, options?: SchemaOptions)`

`@index(fields: IIndexArgs['fields'], options?: IIndexArgs['options']`

`@subModel(options: SchemaOptions & {name?: string} = {})`

## Schema level Decorators

`@prop(options: SchemaTypeOpts<T> = {}, type?: T)`

`@array(type?: T, options?: SchemaTypeOpts<T>)`

`@id` empty decorator, just for emit Reflect metadata for `_id`

`@required` set schema `{required: true}`

`@indexed` set schema `{index: true}`

`@hidden` set schema `{select: false}`

`@unique` set schema `{unique: false}`

`@type(type)` set schema `{type: type}`

`@ref(nameOrClass: string | IMongooseClass)` set schema `{ref: nameOrClass}`
if type isn't set, and the argument is class, `mongoose-typescript` will try to using the typeof `class._id`, if cannot determined the type, using `mongoose.Types.ObjectId`

`@statics` register statics method

`@methods` register instance method

`@query` register query helper

`@virtual` register virtual field

## APIDOC
<https://bangbang93.github.io/mongoose-typescript>
