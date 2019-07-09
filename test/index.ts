// tslint:disable:no-console
import * as mongoose from 'mongoose'
import 'should'
import {
  array, getModel, getSchema, hidden, id, index, indexed, methods, middleware, Model, model, ModelType, ObjectId,
  plugin, prop,
  Ref, ref,
  required, statics, subModel, unique,
} from '../src'

mongoose.connect('mongodb://localhost/test')

function testPlugin(schema: mongoose.Schema, options: any) {
  schema.statics.testPluginFunc = () => options
}

@subModel()
class Address {
  @prop() @required public country: string
  @prop() @required public province: string
  @prop() @required public city: string
  @prop() @required public address: string
}

enum AccountRole {
  user = 'USER',
  admin = 'ADMIN',
}
@subModel()
class Account {
  @prop() @required public name: string
  @prop() public role: AccountRole
}

let hookRun = 0

@model('some-string-id-model')
class SomeStringIdModel {
  @id
  public readonly _id: string
}

@model('user')
@middleware<User>('findOne', 'pre', () => hookRun ++)
@plugin(testPlugin, { testPlugin: true })
class User extends Model<User> {
  @statics
  public static async findByName(name: string): Promise<User> {
    return this.findOne({username: name})
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @prop() @unique @required public username: string
  @prop() @hidden public password: string
  @prop() @indexed public loginCount: number
  @array(Address) public addresses: Address[]
  @prop() public account: Account
  @ref(() => SomeStringIdModel, String) public someStringIdModel: Ref<SomeStringIdModel>

  @methods
  public addAddress(address: Address) {
    this.addresses.push(address)
    return this
  }
}

@model('organization')
@index({user: 1, name: 1}, {unique: true})
class Organization extends Model<Organization> {
  @statics
  public static async listByUser(userId: string) {
    return this.find({
      members: userId,
    })
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @ref(() => User, ObjectId) @required public user: Ref<User>
  @prop() @unique @required public name: string
  @array() @ref(() => User, ObjectId) public members: Array<Ref<User>>

  @methods
  public async addMember(userId: mongoose.Types.ObjectId) {
    this.members.push(userId)
    return this.save()
  }
}

describe('User', function (this) {
  let UserModel: ModelType<User> & typeof User
  it('getModel', function (this) {
    UserModel = getModel(User)
    UserModel.should.hasOwnProperty('findByName')
  })

  it('find', function (this) {
    return UserModel.findByName('aaa')
  })

  it('document', async function (this) {
    const user = new UserModel({
      username: 'abc',
      password: 'wow',
      addresses: [{
        country: 'china',
        city: 'hangzhou',
        address: 'xihu',
      }],
      account: {
        name: 'aaa',
      },
    })

    user.someStringIdModel = 'a'

    user.addAddress({
      country: 'china',
      province: 'zhejiang',
      city: 'hangzhou',
      address: 'cuiyuan',
    })

    user.addresses[0].country.should.eql('china')

    await user.save().should
        .rejectedWith('user validation failed: addresses.0.province: Path `province` is required.')
  })

  it('hook', function (this) {
    hookRun.should.greaterThan(0)
  })

  it('plugin', function (this) {
    (UserModel as any).testPluginFunc().testPlugin.should.eql(true)
  })
})

describe('organization', function (this) {
  let OrganizationModel: typeof Organization
  it('getModel', function (this) {
    const OrganizationSchema = getSchema(Organization)
    OrganizationModel = getModel(Organization)
    OrganizationModel.should.hasOwnProperty('listByUser')
    OrganizationSchema['paths'].members.casterConstructor.name.should.eql('ObjectId')
  })
})

after(async function (this) {
  await mongoose.disconnect()
})
