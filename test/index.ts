// tslint:disable:no-console
import * as mongoose from 'mongoose'
import 'should'
import {
  array, getModel, hidden, id, index, indexed, methods, middleware, Model, model, prop, Ref, ref, required, statics,
  subModel, unique,
} from '../src'

mongoose.connect('mongodb://localhost/test')

@subModel()
class Address {
  @prop() @required public country: string
  @prop() @required public province: string
  @prop() @required public city: string
  @prop() @required public address: string
}

let hookRun = 0

@model('user')
@middleware<User>('findOne', 'pre', () => hookRun ++)
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

  @ref(User) @required public user: Ref<User>
  @prop() @unique @required public name: string
  @array() @ref(User) public members: Array<Ref<User>>

  @methods
  public async addMember(userId: mongoose.Types.ObjectId) {
    this.members.push(userId)
    return this.save()
  }
}

describe('User', function (this) {
  let UserModel: typeof User
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
    })

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
})

describe('organization', function (this) {
  let OrganizationModel: typeof Organization
  it('getModel', function (this) {
    OrganizationModel = getModel(Organization)
    OrganizationModel.should.hasOwnProperty('listByUser')
  })
})

after(async function (this) {
  await mongoose.disconnect()
})
