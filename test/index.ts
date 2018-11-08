// tslint:disable:no-console
import * as mongoose from 'mongoose'
import 'should'
import {
  array, DocumentType, getModel, hidden, id, index, indexed, methods, model, ModelType, prop, Ref, ref, required,
  statics, subModel, unique,
} from '../src'

mongoose.connect('mongodb://localhost/test')

@subModel()
class Address {
  @prop() @required public country: string
  @prop() @required public province: string
  @prop() @required public city: string
  @prop() @required public address: string
}

@model('user')
class User {
  @statics
  public static async findByName(this: IUserModel, name: string): Promise<IUserDocument> {
    return this.findOne({username: name})
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @prop() @unique @required public username: string
  @prop() @hidden public password: string
  @prop() @indexed public loginCount: number
  @array(Address) public addresses: Address[]
}
type IUserDocument = DocumentType<User>
type IUserModel = ModelType<User> & typeof User

const UserModel: IUserModel = getModel(User)

UserModel.should.hasOwnProperty('findByName')
const user = new UserModel({
  username: 'abc',
  password: 'wow',
  addresses: [{
    country: 'china',
    city: 'hangzhou',
    address: 'xihu',
  }],
})

user.save().should
    .rejectedWith('user validation failed: addresses.0.province: Path `province` is required.')

user.addresses[0].country.should.eql('china')

@model('organization')
@index({user: 1, name: 1}, {unique: true})
class Organization {
  @statics
  public static async listByUser(this: IOrganizationModel, userId: string) {
    return this.find({
      members: userId,
    })
  }

  @id public readonly _id: mongoose.Types.ObjectId

  @ref(User) @required public user: Ref<User>
  @prop() @unique @required public name: string
  @array() @ref(User) public members: Array<Ref<User>>

  @methods
  public async addMember(this: IOrganizationDocument, userId: mongoose.Types.ObjectId) {
    this.members.push(userId)
    return this.save()
  }
}
type IOrganizationDocument = DocumentType<Organization>
type IOrganizationModel = ModelType<Organization> & typeof Organization

const OrganizationModel: IOrganizationModel = getModel(Organization)

OrganizationModel.should.hasOwnProperty('listByUser')
